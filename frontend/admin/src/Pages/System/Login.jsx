/**
 * @description
 * 로그인 페이지입니다.
 * 비로그인 상태에서 AuthGuard에 의해 이 페이지로 리다이렉트됩니다.
 * 로그인 성공 시 원래 접근하려던 경로로 이동합니다.
 */
import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { useUser } from '@/Providers/UserContext.jsx';
import { Button } from '@/Components/ui/Button.jsx';
import { Input } from '@/Components/ui/Input.jsx';
import { Label } from '@/Components/ui/label.jsx';
import {
    Card,
    CardHeader,
    CardTitle,
    CardDescription,
    CardContent,
} from '@/Components/ui/card.jsx';

const loginSchema = z.object({
    email: z
        .string()
        .min(1, '이메일을 입력하세요')
        .email('올바른 이메일 형식이 아닙니다'),
    password: z.string().min(1, '비밀번호를 입력하세요'),
});

function Login() {
    const { login } = useUser();
    const navigate = useNavigate();
    const location = useLocation();
    const [serverError, setServerError] = useState('');

    const from = location.state?.from?.pathname || '/';

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm({
        resolver: zodResolver(loginSchema),
        defaultValues: { email: '', password: '' },
    });

    const onSubmit = async (data) => {
        setServerError('');
        try {
            await login(data.email, data.password);
            navigate(from, { replace: true });
        } catch (error) {
            const message =
                error.response?.data?.message ||
                '로그인에 실패했습니다. 다시 시도해주세요.';
            setServerError(message);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-background px-4">
            <Card className="loginCard w-full max-w-sm">
                <CardHeader className="text-center">
                    <CardTitle className="text-2xl">CMS Admin</CardTitle>
                    <CardDescription>
                        관리자 계정으로 로그인하세요
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form
                        onSubmit={handleSubmit(onSubmit)}
                        className="flex flex-col gap-4"
                    >
                        <div className="flex flex-col gap-2">
                            <Label htmlFor="email">이메일</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="admin@cms.com"
                                autoComplete="email"
                                {...register('email')}
                            />
                            {errors.email && (
                                <p className="text-sm text-destructive">
                                    {errors.email.message}
                                </p>
                            )}
                        </div>

                        <div className="flex flex-col gap-2">
                            <Label htmlFor="password">비밀번호</Label>
                            <Input
                                id="password"
                                type="password"
                                placeholder="비밀번호를 입력하세요"
                                autoComplete="current-password"
                                {...register('password')}
                            />
                            {errors.password && (
                                <p className="text-sm text-destructive">
                                    {errors.password.message}
                                </p>
                            )}
                        </div>

                        {serverError && (
                            <p className="text-sm text-destructive text-center">
                                {serverError}
                            </p>
                        )}

                        <Button
                            type="submit"
                            className="w-full"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? '로그인 중...' : '로그인'}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}

export default Login;
