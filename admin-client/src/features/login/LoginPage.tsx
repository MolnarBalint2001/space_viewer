import React from "react";
import { Card } from "primereact/card";
import { InputText } from "primereact/inputtext";
import { Password } from "primereact/password";
import { Button } from "primereact/button";
import { Checkbox } from "primereact/checkbox";
import { classNames } from "primereact/utils";
import { useFormik } from "formik";
import { LoginValidationScheme } from "./schemes/login.scheme";
import { AdminAuthApi } from "../../config/api";
import { useApi } from "../../hooks/useApi";
import { useAuth } from "../../components/AuthContext";
import { useToast } from "../../components/ToastContext";
import { useNavigate } from "react-router-dom";
import { routes } from "../../config/routes";

export const LoginPage: React.FC = () => {
    const api = useApi(AdminAuthApi);
    const { notifyError } = useToast();
    const { setToken } = useAuth();
    const navigate = useNavigate();

    const formik = useFormik({
        initialValues: {
            email: "",
            password: "",
            rememberMe: false,
        },
        validationSchema: LoginValidationScheme,
        onSubmit: async (values) => {
            try {
                const res = await api.adminAuthLoginPost({
                    email: values.email,
                    password: values.password,
                });
                setToken(res.data.token);
                navigate(routes.dashboard)
            } catch {
                notifyError(
                    "Incorrect email address or password.",
                    "Sign-in failed"
                );
            }
        },
    });

    const isInvalid = (name: keyof typeof formik.values) =>
        !!(formik.touched[name] && formik.errors[name]);

    return (
        <div
            className="flex items-center justify-center"
            style={{
                minHeight: "calc(100vh - 65px)",
                background: "var(--surface-ground)",
            }}
        >
            <Card
                title="NASA Webviewer Admin"
                pt={{ title: { className: "text-center" } }}
                className="shadow-2 border-round-xl w-full"
                style={{ maxWidth: 640 }}
            >
                <form onSubmit={formik.handleSubmit} className="p-fluid">
                    {/* Email */}
                    <div className="field mb-3">
                        <label
                            htmlFor="email"
                            className={classNames({
                                "p-error": isInvalid("email"),
                            })}
                        >
                            Email
                        </label>
                        <InputText
                            id="email"
                            name="email"
                            type="email"
                            value={formik.values.email}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            className={classNames({
                                "p-invalid": isInvalid("email"),
                            })}
                            placeholder="example@domain.com"
                            autoComplete="username"
                        />
                        {isInvalid("email") && (
                            <small className="p-error">
                                {formik.errors.email as string}
                            </small>
                        )}
                    </div>

                    {/* Password */}
                    <div className="field mb-3">
                        <label
                            htmlFor="password"
                            className={classNames({
                                "p-error": isInvalid("password"),
                            })}
                        >
                            Password
                        </label>
                        <Password
                            id="password"
                            name="password"
                            value={formik.values.password}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            className={classNames({
                                "p-invalid": isInvalid("password"),
                            })}
                            inputClassName={classNames({
                                "p-invalid": isInvalid("password"),
                            })}
                            feedback={false}
                            toggleMask
                            inputProps={{
                                autoComplete: "current-password",
                                placeholder: "••••••••",
                            }}
                        />
                        {isInvalid("password") && (
                            <small className="p-error">
                                {formik.errors.password as string}
                            </small>
                        )}
                    </div>

                    {/* Remember me + Forgotten password */}
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <Checkbox
                                inputId="rememberMe"
                                name="rememberMe"
                                onChange={(e) =>
                                    formik.setFieldValue(
                                        "rememberMe",
                                        e.checked
                                    )
                                }
                                checked={formik.values.rememberMe}
                            />
                            <label htmlFor="rememberMe">Remember me</label>
                        </div>
                        <a
                            href="#"
                            className="text-primary-600 hover:underline"
                        >
                            Forgot password?
                        </a>
                    </div>

                    <Button
                        type="submit"
                        label={
                            formik.isSubmitting
                                ? "Signing in..."
                                : "Sign in"
                        }
                        icon={
                            formik.isSubmitting
                                ? "pi pi-spin pi-spinner"
                                : "pi pi-sign-in"
                        }
                        disabled={formik.isSubmitting}
                    />
                </form>
            </Card>
        </div>
    );
};
