import "./overviewSections.css";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BookOpen, Plus, ArrowRight } from "lucide-react";
import { getAdminFAQs } from "../../../services/api";

const CATEGORY_COLORS = {
  general:  { bg: "rgba(94,182,252,0.12)",  color: "#5EB6FC"  },
  payments: { bg: "rgba(255,159,67,0.12)",  color: "#ff9f43"  },
  billing:  { bg: "rgba(155,108,255,0.12)", color: "#9b6cff"  },
  security: { bg: "rgba(38,222,129,0.12)",  color: "#26de81"  },
  default:  { bg: "rgba(255,255,255,0.06)", color: "#94a3b8"  },
};

function getCategoryStyle(category) {
  const key = category?.toLowerCase() || "default";
  return CATEGORY_COLORS[key] || CATEGORY_COLORS.default;
}

function formatDate(dateStr) {
  if (!dateStr) return "—";
  try {
    return new Date(dateStr).toLocaleDateString("en-IN", {
      day: "numeric", month: "short", year: "numeric",
    });
  } catch { return "—"; }
}

export default function KnowledgeBaseCard() {
  const navigate = useNavigate();
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAdminFAQs()
      .then((data) => setFaqs(data ?? []))
      .catch((err) => console.error("Failed to load FAQs", err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="kb-card glass-card">
      <style>{`
        .kb-scroll::-webkit-scrollbar { width: 4px; }
        .kb-scroll::-webkit-scrollbar-track { background: transparent; }
        .kb-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 10px; }
        .kb-scroll::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.18); }
        .kb-category-badge {
          display: inline-flex;
          align-items: center;
          padding: 3px 10px;
          border-radius: 20px;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.4px;
          width: fit-content;
          text-transform: capitalize;
          white-space: nowrap;
        }
      `}</style>

      <div className="card-header">
        <BookOpen size={18} />
        <h3>Knowledge Base</h3>
      </div>
      <div className="card-divider" />

      <div className="kb-table-header">
        <span>FAQ Article</span>
        <span>Category</span>
        <span>Last Updated</span>
        <span>Action</span>
      </div>

      {loading && (
        <div style={{ padding: "16px 0", color: "rgba(255,255,255,0.3)", fontSize: 13 }}>
          Loading FAQs...
        </div>
      )}

      {!loading && faqs.length === 0 && (
        <div style={{ padding: "16px 0", color: "rgba(255,255,255,0.3)", fontSize: 13 }}>
          No FAQs yet. Add some in the Knowledge Base tab.
        </div>
      )}

      {!loading && faqs.length > 0 && (
        <>
          <div
            className="kb-scroll"
            style={{
              maxHeight: 260, overflowY: "auto",
              scrollbarWidth: "thin",
              scrollbarColor: "rgba(255,255,255,0.08) transparent",
              marginRight: -6, paddingRight: 6,
            }}
          >
            {faqs.map((faq, index) => {
              const s = getCategoryStyle(faq.category);
              const dateStr = faq.created_at || faq.updated_at || null;
              return (
                <div key={faq.faq_id || index} className="kb-row">
                  <span className="kb-title">
                    {faq.question?.length > 36 ? faq.question.slice(0, 36) + "…" : faq.question}
                  </span>

                  {/* ✅ Fixed badge — pill shape with proper display */}
                  <span
                    className="kb-category-badge"
                    style={{
                      background: s.bg,
                      color: s.color,
                      border: `1px solid ${s.color}55`,
                    }}
                  >
                    {faq.category || "general"}
                  </span>

                  <span className="kb-date">{formatDate(dateStr)}</span>

                  <button className="kb-btn" onClick={() => navigate("/admin/knowledge-base")}>
                    <Plus size={11} style={{ marginRight: 3 }} />
                    Add
                  </button>
                </div>
              );
            })}
          </div>

          <div
            onClick={() => navigate("/admin/knowledge-base")}
            style={{
              marginTop: 14, display: "flex", alignItems: "center",
              gap: 6, color: "#5EB6FC", fontSize: 12, fontWeight: 600,
              cursor: "pointer", opacity: 0.7, transition: "opacity 0.2s",
            }}
            onMouseEnter={e => e.currentTarget.style.opacity = 1}
            onMouseLeave={e => e.currentTarget.style.opacity = 0.7}
          >
            View all in Knowledge Base <ArrowRight size={13} />
          </div>
        </>
      )}
    </div>
  );
}