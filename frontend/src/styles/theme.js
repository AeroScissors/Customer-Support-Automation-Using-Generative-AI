import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    mode: "dark",

    // App + page background
    background: {
      default: "#0a0f1c", // deeper near-black navy
      paper: "#111827",   // cards / panels (clear separation)
    },

    // Primary actions / selection / active states
    primary: {
      main: "#14b8a6", // teal
    },

    // Informational accents / chips
    secondary: {
      main: "#22d3ee", // cyan
    },

    // Text hierarchy
    text: {
      primary: "#e2e8f0",   // soft white (premium)
      secondary: "#94a3b8", // muted gray-blue
    },

    // Dividers / borders
    divider: "rgba(255,255,255,0.06)",
  },

  typography: {
    fontFamily: [
      "Inter",
      "system-ui",
      "-apple-system",
      "BlinkMacSystemFont",
      "Segoe UI",
      "sans-serif",
    ].join(","),

    h6: {
      fontWeight: 600,
    },

    subtitle2: {
      letterSpacing: "0.08em",
      fontWeight: 600,
    },

    body2: {
      lineHeight: 1.6,
    },
  },

  shape: {
    borderRadius: 12,
  },

  components: {
    // Cards / panels
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
          border: "1px solid rgba(255,255,255,0.06)",
          boxShadow:
            "0 0 0 1px rgba(255,255,255,0.03), 0 20px 40px rgba(0,0,0,0.45)",
        },
      },
    },

    // Chips
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 500,
        },
      },
    },
  },
});

export default theme;
