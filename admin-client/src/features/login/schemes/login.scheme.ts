import * as Yup from "yup"


export const LoginValidationScheme = Yup.object({
    email: Yup.string()
        .email("Enter a valid email address.")
        .required("Email is required"),
    password: Yup.string()
        .min(6, "Must be at least 6 characters")
        .required("Password is required"),
});
