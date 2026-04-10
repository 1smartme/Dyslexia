const API_URL = "http://localhost:5000/api/auth";

export async function signUp(
  email: string,
  password: string,
  fullName: string,
  role: string
) {
  try {
    const response = await fetch(`${API_URL}/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        name: fullName,
        email,
        password
      })
    });

    const data = await response.json();

    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
}

export async function signIn(
  email: string,
  password: string
) {
  try {
    const response = await fetch(`${API_URL}/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        email,
        password
      })
    });

    const data = await response.json();

    if (response.ok) {
      localStorage.setItem("token", data.token);
    }

    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
}
