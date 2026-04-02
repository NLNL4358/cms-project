import {
  Injectable,
  Logger,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
import archiver from 'archiver';
import AdmZip from 'adm-zip';

const PG_DUMP_PATH = process.env.PG_DUMP_PATH || '/usr/local/Cellar/postgresql@17/17.7_1/bin/pg_dump';
const PG_RESTORE_PATH = process.env.PG_RESTORE_PATH || '/usr/local/Cellar/postgresql@17/17.7_1/bin/psql';

@Injectable()
export class BackupService {
  private readonly logger = new Logger(BackupService.name);
  private readonly backupDir: string;
  private readonly uploadsDir: string;

  constructor(private configService: ConfigService) {
    this.backupDir = path.join(process.cwd(), 'backups');
    this.uploadsDir = path.join(process.cwd(), 'uploads');

    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir, { recursive: true });
    }
  }

  /**
   * 백업 생성 (DB + 업로드 파일을 ZIP으로 묶음)
   */
  async create(description?: string): Promise<any> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const sqlFilename = `_temp-${timestamp}.sql`;
    const sqlPath = path.join(this.backupDir, sqlFilename);
    const zipFilename = `backup-${timestamp}.zip`;
    const zipPath = path.join(this.backupDir, zipFilename);

    try {
      // 1. pg_dump
      execSync(
        `PGPASSWORD=root ${PG_DUMP_PATH} -h localhost -U postgres -d cms_db --clean --if-exists > "${sqlPath}"`,
        { timeout: 60000 },
      );

      // 2. ZIP 생성 (SQL + uploads 폴더)
      await this.createZip(zipPath, sqlPath);

      // 3. 임시 SQL 삭제
      if (fs.existsSync(sqlPath)) fs.unlinkSync(sqlPath);

      const stats = fs.statSync(zipPath);
      const meta = {
        filename: zipFilename,
        description: description || '수동 백업',
        size: stats.size,
        createdAt: new Date().toISOString(),
      };

      this.saveMetaList(zipFilename, meta);
      this.logger.log(`백업 생성 완료: ${zipFilename} (${this.formatSize(stats.size)})`);
      return { ...meta, sizeFormatted: this.formatSize(stats.size) };
    } catch (error) {
      // 실패 시 정리
      if (fs.existsSync(sqlPath)) fs.unlinkSync(sqlPath);
      if (fs.existsSync(zipPath)) fs.unlinkSync(zipPath);
      this.logger.error(`백업 생성 실패: ${error.message}`);
      throw new InternalServerErrorException('백업 생성에 실패했습니다: ' + error.message);
    }
  }

  /**
   * 백업 목록 조회
   */
  async findAll() {
    const metaPath = path.join(this.backupDir, '_meta.json');
    if (!fs.existsSync(metaPath)) return [];

    const metas = JSON.parse(fs.readFileSync(metaPath, 'utf-8'));

    return metas
      .filter((m: any) => fs.existsSync(path.join(this.backupDir, m.filename)))
      .map((m: any) => ({
        ...m,
        sizeFormatted: this.formatSize(m.size),
      }))
      .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  /**
   * 백업 파일 다운로드 경로
   */
  async getFilePath(filename: string): Promise<string> {
    const filepath = path.join(this.backupDir, filename);
    if (!fs.existsSync(filepath)) {
      throw new NotFoundException('백업 파일을 찾을 수 없습니다');
    }
    if (!filepath.startsWith(this.backupDir)) {
      throw new NotFoundException('잘못된 파일 경로입니다');
    }
    return filepath;
  }

  /**
   * 백업 복원 (ZIP에서 SQL + uploads 추출)
   */
  async restore(filename: string) {
    const filepath = await this.getFilePath(filename);
    return this.restoreFromZipPath(filepath);
  }

  /**
   * 업로드된 백업 파일로 복원
   */
  async restoreFromUpload(file: Express.Multer.File) {
    if (!file) {
      throw new InternalServerErrorException('파일이 업로드되지 않았습니다');
    }

    const ext = path.extname(file.originalname).toLowerCase();
    if (ext !== '.zip' && ext !== '.sql') {
      // 잘못된 파일 정리
      if (file.path && fs.existsSync(file.path)) fs.unlinkSync(file.path);
      throw new InternalServerErrorException('.zip 또는 .sql 파일만 업로드할 수 있습니다');
    }

    // diskStorage → file.path에 이미 디스크에 저장됨
    const tempPath = file.path;

    try {
      if (ext === '.zip') {
        return await this.restoreFromZipPath(tempPath);
      } else {
        return await this.restoreFromSqlPath(tempPath);
      }
    } finally {
      if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
    }
  }

  /**
   * 백업 삭제
   */
  async remove(filename: string) {
    const filepath = await this.getFilePath(filename);
    fs.unlinkSync(filepath);
    this.removeMetaEntry(filename);
    this.logger.log(`백업 삭제: ${filename}`);
    return { success: true };
  }

  /** ZIP에서 DB + uploads 복원 */
  private async restoreFromZipPath(zipPath: string) {
    const tempDir = path.join(this.backupDir, `_restore-${Date.now()}`);

    try {
      // ZIP 해제
      const zip = new AdmZip(zipPath);
      zip.extractAllTo(tempDir, true);

      // SQL 파일 찾기
      const sqlFile = fs.readdirSync(tempDir).find((f) => f.endsWith('.sql'));
      if (sqlFile) {
        const sqlPath = path.join(tempDir, sqlFile);
        await this.restoreFromSqlPath(sqlPath);
      }

      // uploads 폴더 복원
      const extractedUploads = path.join(tempDir, 'uploads');
      if (fs.existsSync(extractedUploads)) {
        // 기존 uploads 비우지 않고 덮어쓰기 (안전)
        this.copyDirRecursive(extractedUploads, this.uploadsDir);
        this.logger.log('업로드 파일 복원 완료');
      }

      this.logger.log(`ZIP 복원 완료: ${path.basename(zipPath)}`);
      return { success: true, message: '데이터베이스와 업로드 파일이 복원되었습니다. 페이지가 새로고침됩니다.' };
    } catch (error) {
      this.logger.error(`복원 실패: ${error.message}`);
      throw new InternalServerErrorException('복원에 실패했습니다: ' + error.message);
    } finally {
      // 임시 디렉토리 정리
      if (fs.existsSync(tempDir)) {
        fs.rmSync(tempDir, { recursive: true, force: true });
      }
    }
  }

  /** SQL 파일로 DB 복원 */
  private async restoreFromSqlPath(sqlPath: string) {
    execSync(
      `PGPASSWORD=root ${PG_RESTORE_PATH} -h localhost -U postgres -d cms_db -1 < "${sqlPath}"`,
      { timeout: 120000 },
    );
    this.logger.log(`SQL 복원 완료: ${path.basename(sqlPath)}`);
    return { success: true, message: '데이터베이스가 복원되었습니다. 페이지가 새로고침됩니다.' };
  }

  /** ZIP 생성 (SQL + uploads) */
  private createZip(zipPath: string, sqlPath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const output = fs.createWriteStream(zipPath);
      const archive = archiver('zip', { zlib: { level: 6 } });

      output.on('close', () => resolve());
      archive.on('error', (err: Error) => reject(err));

      archive.pipe(output);

      // SQL 파일 추가
      archive.file(sqlPath, { name: 'database.sql' });

      // uploads 폴더 추가 (존재하면)
      if (fs.existsSync(this.uploadsDir)) {
        archive.directory(this.uploadsDir, 'uploads');
      }

      archive.finalize();
    });
  }

  /** 디렉토리 재귀 복사 */
  private copyDirRecursive(src: string, dest: string) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    const entries = fs.readdirSync(src, { withFileTypes: true });
    for (const entry of entries) {
      const srcPath = path.join(src, entry.name);
      const destPath = path.join(dest, entry.name);
      if (entry.isDirectory()) {
        this.copyDirRecursive(srcPath, destPath);
      } else {
        fs.copyFileSync(srcPath, destPath);
      }
    }
  }

  /** 메타데이터 저장 */
  private saveMetaList(filename: string, meta: any) {
    const metaPath = path.join(this.backupDir, '_meta.json');
    let metas: any[] = [];
    if (fs.existsSync(metaPath)) {
      metas = JSON.parse(fs.readFileSync(metaPath, 'utf-8'));
    }
    metas.push(meta);
    fs.writeFileSync(metaPath, JSON.stringify(metas, null, 2), 'utf-8');
  }

  /** 메타데이터에서 항목 제거 */
  private removeMetaEntry(filename: string) {
    const metaPath = path.join(this.backupDir, '_meta.json');
    if (!fs.existsSync(metaPath)) return;
    let metas: any[] = JSON.parse(fs.readFileSync(metaPath, 'utf-8'));
    metas = metas.filter((m: any) => m.filename !== filename);
    fs.writeFileSync(metaPath, JSON.stringify(metas, null, 2), 'utf-8');
  }

  /** 파일 크기 포맷 */
  private formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
}
