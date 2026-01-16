export interface ResetPasswordConfirmParams {
  password: string;
  password2: string;
  token: string;
}

export const resetPasswordConfirm = async ({
  password,
  password2,
  token,
}: ResetPasswordConfirmParams) => {
  const response = await fetch(
    "https://app.linkaform.com/api/infosync/user_admin/reset_password_confirm/",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        password,
        password2,
        token,
      }),
    }
  );
  if (response.ok) {
    return { success: true };
  }

  let errorData = null;
  try {
    errorData = await response.json();
  } catch {}

  throw {
    status: response.status,
    error: errorData,
  };
};


export interface ResetPasswordEmailParams {
  username: string;
}

export const resetPasswordEmail = async ({
  username,
}: ResetPasswordEmailParams) => {
  const response = await fetch(
    "https://app.linkaform.com/api/infosync/pwd_reset/",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username,
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "Error al enviar correo");
  }

  return true;
};

