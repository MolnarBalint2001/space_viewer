import * as Yup from "yup"


export const LoginValidationScheme = Yup.object({
    email: Yup.string()
        .email("Érvényes e-mail címet adj meg!")
        .required("E-mail kötelező"),
    password: Yup.string()
        .min(6, "Legalább 6 karakter")
        .required("Jelszó kötelező"),
});