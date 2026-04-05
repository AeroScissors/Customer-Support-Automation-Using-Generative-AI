import { useState } from "react";
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Alert,
} from "@mui/material";
import { useNavigate } from "react-router-dom";

const BASE_URL = "https://aeroscissors-nebulacore.hf.space";

export default function Login() {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch(`${BASE_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || "Login failed");
      }

      const data = await res.json();

      // ✅ Updated: Store auth data in sessionStorage
      sessionStorage.setItem("access_token", data.access_token);
      sessionStorage.setItem("role", data.role);

      // Redirect based on role
      if (data.role === "admin") {
        navigate("/admin");
      } else {
        navigate("/agent");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at top, #0f1c2e 0%, #050a14 60%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Paper
        sx={{
          width: 380,
          p: 4,
          background:
            "linear-gradient(180deg, rgba(22,35,55,0.95), rgba(12,20,34,0.95))",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 2,
          backdropFilter: "blur(12px)",
          boxShadow:
            "0 0 0 1px rgba(76,201,240,0.08), 0 20px 40px rgba(0,0,0,0.6)",
        }}
      >
        <Typography
          fontSize={20}
          fontWeight={600}
          mb={1}
          color="#e6f1ff"
        >
          GenAI Support
        </Typography>

        <Typography
          fontSize={13}
          color="#8faac6"
          mb={3}
        >
          Sign in with your issued credentials
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <form onSubmit={handleLogin}>
          <TextField
            fullWidth
            label="Username"
            variant="outlined"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            margin="normal"
            required
          />

          <TextField
            fullWidth
            label="Password"
            type="password"
            variant="outlined"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            margin="normal"
            required
          />

          <Button
            type="submit"
            fullWidth
            variant="contained"
            disabled={loading}
            sx={{ mt: 3 }}
          >
            {loading ? "Signing in..." : "Login"}
          </Button>
        </form>

        <Typography
          fontSize={11}
          color="#6f8fb3"
          mt={3}
          textAlign="center"
        >
          Accounts are issued by the administrator
        </Typography>
      </Paper>
    </Box>
  );
}