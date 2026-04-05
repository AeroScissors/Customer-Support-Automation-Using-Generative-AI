import {
  Box, Typography, Paper, Divider, Chip, Button, 
  TextField, Dialog, DialogTitle, DialogContent, 
  DialogActions, IconButton, InputAdornment
} from "@mui/material";
import { Delete, Add, Search, Edit } from "@mui/icons-material";
import { useEffect, useState } from "react";
import { getAdminFAQs, createAdminFAQ, deleteAdminFAQ, updateAdminFAQ } from "../../services/api";

export default function AdminKnowledgeBase() {
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  
  const [open, setOpen] = useState(false);
  const [newFaq, setNewFaq] = useState({ question: "", answer: "", category: "General" });

  const [editOpen, setEditOpen] = useState(false);
  const [selectedFAQ, setSelectedFAQ] = useState(null);

  useEffect(() => { loadData(); }, []);

  const loadData = () => {
    setLoading(true);
    getAdminFAQs()
      .then(setFaqs)
      .catch((err) => console.error("Sync Error:", err))
      .finally(() => setLoading(false));
  };

  const handleCreate = async () => {
    try {
      await createAdminFAQ(newFaq);
      setOpen(false);
      setNewFaq({ question: "", answer: "", category: "General" });
      loadData();
    } catch (err) { 
      alert("Failed to update AI knowledge base: " + err.message); 
    }
  };

  const handleUpdate = async () => {
    try {
      await updateAdminFAQ({
        faq_id: selectedFAQ.faq_id, 
        question: selectedFAQ.question,
        answer: selectedFAQ.answer,
        category: selectedFAQ.category,
      });
      setEditOpen(false);
      loadData();
    } catch (err) {
      alert("Failed to update FAQ: " + err.message);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to remove this information from the AI knowledge base?")) {
      try {
        await deleteAdminFAQ(id);
        loadData();
      } catch (err) {
        alert("Deletion failed: " + err.message);
      }
    }
  };

  const filteredFaqs = faqs.filter(f => 
    f.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
    f.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  /**
   * Premium UI Styling
   */
  const fieldStyles = {
    "& .MuiOutlinedInput-root": {
      color: "#fff",
      bgcolor: "rgba(255,255,255,0.03)",
      borderRadius: "14px",
      "& fieldset": { borderColor: "rgba(255,255,255,0.08)" },
      "&:hover fieldset": { borderColor: "#5EB6FC" },
      "&.Mui-focused fieldset": {
        borderColor: "#5EB6FC",
        boxShadow: "0 0 0 3px rgba(94,182,252,0.15)"
      }
    }
  };

  const labelStyles = {
    fontSize: 13,
    mb: 1,
    sx: { color: "rgba(255,255,255,0.5)" }
  };

  const dialogPaperStyles = {
    sx: {
      bgcolor: "#0E1628",
      borderRadius: "20px",
      border: "1px solid rgba(255,255,255,0.06)",
      boxShadow: "0 30px 80px rgba(0,0,0,0.6)",
      p: 1
    }
  };

  return (
    <Box>
      <Box mb={3} display="flex" justifyContent="space-between" alignItems="center">
        <Box>
          <Typography fontSize={22} fontWeight={600}>Knowledge Base</Typography>
          <Typography fontSize={13} color="#8faac6">
            The source data used by the LLM to generate context-aware responses
          </Typography>
        </Box>
        <Button 
          variant="contained" 
          startIcon={<Add />} 
          onClick={() => setOpen(true)}
          sx={{ bgcolor: "#4cc9f0", '&:hover': { bgcolor: "#3fb0d4" } }}
        >
          Add FAQ
        </Button>
      </Box>

      <TextField
        fullWidth
        placeholder="Search enterprise knowledge..."
        variant="outlined"
        size="small"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        sx={{ mb: 3, input: { color: 'white' }, "& .MuiOutlinedInput-root": { bgcolor: "rgba(255,255,255,0.05)" } }}
        InputProps={{
          startAdornment: <InputAdornment position="start"><Search sx={{ color: '#8faac6' }} /></InputAdornment>,
        }}
      />

      <Paper sx={{ background: "linear-gradient(180deg, rgba(22,35,55,0.95), rgba(12,20,34,0.95))", borderRadius: 2, border: "1px solid rgba(255,255,255,0.08)" }}>
        {loading ? (
           <Box p={3}><Typography color="#8faac6">Updating Knowledge Base...</Typography></Box>
        ) : filteredFaqs.map((item, idx) => (
          <Box key={item.faq_id || idx}>
            <Box sx={{ display: "grid", gridTemplateColumns: "1fr 140px 120px", alignItems: "center", px: 2.5, py: 2 }}>
              <Typography fontSize={14} fontWeight={500}>{item.question}</Typography>
              <Chip label={item.category || "General"} size="small" sx={{ bgcolor: "rgba(76,201,240,0.12)", color: "#4cc9f0" }} />
              
              <Box display="flex" justifyContent="flex-end" gap={1}>
                <IconButton 
                  onClick={() => { setSelectedFAQ(item); setEditOpen(true); }} 
                  size="small" 
                  sx={{ color: "#5EB6FC", bgcolor: "rgba(94,182,252,0.1)", "&:hover": { bgcolor: "rgba(94,182,252,0.2)" } }}
                >
                  <Edit fontSize="small" />
                </IconButton>
                <IconButton 
                  onClick={() => handleDelete(item.faq_id)} 
                  size="small" 
                  sx={{ color: "#ff4d4d", bgcolor: "rgba(255,77,77,0.1)", "&:hover": { bgcolor: "rgba(255,77,77,0.2)" } }}
                >
                  <Delete fontSize="small" />
                </IconButton>
              </Box>
            </Box>
            {idx !== filteredFaqs.length - 1 && <Divider sx={{ borderColor: "rgba(255,255,255,0.06)" }} />}
          </Box>
        ))}
      </Paper>

      {/* CREATE DIALOG */}
      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="md" PaperProps={dialogPaperStyles}>
        <DialogTitle sx={{ color: "#fff", fontWeight: 600, fontSize: 20 }}>Add Knowledge Entry</DialogTitle>
        <DialogContent sx={{ mt: 1 }}>
          <Box mt={1}>
            <Typography {...labelStyles}>Question</Typography>
            <TextField fullWidth value={newFaq.question} onChange={(e) => setNewFaq({...newFaq, question: e.target.value})} sx={fieldStyles} />
          </Box>
          <Box mt={3}>
            <Typography {...labelStyles}>Answer</Typography>
            <TextField fullWidth multiline rows={5} value={newFaq.answer} onChange={(e) => setNewFaq({...newFaq, answer: e.target.value})} sx={fieldStyles} />
          </Box>
          <Box mt={3}>
            <Typography {...labelStyles}>Category</Typography>
            <TextField select fullWidth SelectProps={{ native: true }} value={newFaq.category} onChange={(e) => setNewFaq({...newFaq, category: e.target.value})} sx={fieldStyles}>
              <option value="General">General</option>
              <option value="Payments">Payments</option>
              <option value="Billing">Billing</option>
              <option value="Security">Security</option>
            </TextField>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, pt: 2 }}>
          <Button onClick={() => setOpen(false)} sx={{ color: "rgba(255,255,255,0.5)", textTransform: "none", fontWeight: 600 }}>Cancel</Button>
          <Button variant="contained" onClick={handleCreate} sx={{ bgcolor: "#5EB6FC", color: "#000", fontWeight: 700, borderRadius: "12px", px: 4, textTransform: "none", "&:hover": { bgcolor: "#4aa3e0" } }}>Save to AI Index</Button>
        </DialogActions>
      </Dialog>

      {/* EDIT DIALOG */}
      <Dialog open={editOpen} onClose={() => setEditOpen(false)} fullWidth maxWidth="md" PaperProps={dialogPaperStyles}>
        <DialogTitle sx={{ color: "#fff", fontWeight: 600, fontSize: 20 }}>Edit Knowledge Entry</DialogTitle>
        <DialogContent sx={{ mt: 1 }}>
          <Box mt={1}>
            <Typography {...labelStyles}>Question</Typography>
            <TextField fullWidth value={selectedFAQ?.question || ""} onChange={(e) => setSelectedFAQ({...selectedFAQ, question: e.target.value})} sx={fieldStyles} />
          </Box>
          <Box mt={3}>
            <Typography {...labelStyles}>Answer</Typography>
            <TextField fullWidth multiline rows={5} value={selectedFAQ?.answer || ""} onChange={(e) => setSelectedFAQ({...selectedFAQ, answer: e.target.value})} sx={fieldStyles} />
          </Box>
          <Box mt={3}>
            <Typography {...labelStyles}>Category</Typography>
            <TextField select fullWidth SelectProps={{ native: true }} value={selectedFAQ?.category || ""} onChange={(e) => setSelectedFAQ({...selectedFAQ, category: e.target.value})} sx={fieldStyles}>
              <option value="General">General</option>
              <option value="Payments">Payments</option>
              <option value="Billing">Billing</option>
              <option value="Security">Security</option>
            </TextField>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, pt: 2 }}>
          <Button onClick={() => setEditOpen(false)} sx={{ color: "rgba(255,255,255,0.5)", textTransform: "none", fontWeight: 600 }}>Cancel</Button>
          <Button variant="contained" onClick={handleUpdate} sx={{ bgcolor: "#5EB6FC", color: "#000", fontWeight: 700, borderRadius: "12px", px: 4, textTransform: "none", "&:hover": { bgcolor: "#4aa3e0" } }}>Update AI Index</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}