import type { ReactNode } from "react";
import { NavLink } from "react-router-dom";

interface Tool {
  path: string;
  label: string;
  icon: ReactNode;
}

const tools: Tool[] = [
  {
    path: "/url-shortener",
    label: "URL Shortener",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-5 h-5"
      >
        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
      </svg>
    ),
  },
  {
    path: "/jwt-decoder",
    label: "JWT Decoder",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-5 h-5"
      >
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
      </svg>
    ),
  },
  {
    path: "/token-generator",
    label: "Token Generator",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-5 h-5"
      >
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
      </svg>
    ),
  },
  {
    path: "/base64",
    label: "Base64",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-5 h-5"
      >
        <polyline points="16 18 22 12 16 6" />
        <polyline points="8 6 2 12 8 18" />
      </svg>
    ),
  },
  {
    path: "/json-formatter",
    label: "JSON Formatter",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-5 h-5"
      >
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
        <polyline points="10 9 9 9 8 9" />
      </svg>
    ),
  },
  {
    path: "/hash-generator",
    label: "Hash Generator",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-5 h-5"
      >
        <line x1="4" y1="9" x2="20" y2="9" />
        <line x1="4" y1="15" x2="20" y2="15" />
        <line x1="10" y1="3" x2="8" y2="21" />
        <line x1="16" y1="3" x2="14" y2="21" />
      </svg>
    ),
  },
  {
    path: "/qr-generator",
    label: "QR Generator",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-5 h-5"
      >
        <rect x="3" y="3" width="7" height="7" />
        <rect x="14" y="3" width="7" height="7" />
        <rect x="14" y="14" width="7" height="7" />
        <rect x="3" y="14" width="7" height="7" />
        <rect
          x="5"
          y="5"
          width="3"
          height="3"
          fill="currentColor"
          stroke="none"
        />
        <rect
          x="16"
          y="5"
          width="3"
          height="3"
          fill="currentColor"
          stroke="none"
        />
        <rect
          x="16"
          y="16"
          width="3"
          height="3"
          fill="currentColor"
          stroke="none"
        />
        <rect
          x="5"
          y="16"
          width="3"
          height="3"
          fill="currentColor"
          stroke="none"
        />
      </svg>
    ),
  },
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export default function Sidebar({ collapsed, onToggle }: SidebarProps) {
  return (
    <aside
      className={`flex flex-col bg-surface-raised border-r border-surface-overlay transition-all duration-300 shrink-0 ${
        collapsed ? "w-16" : "w-60"
      }`}
    >
      {/* Header / Toggle */}
      <div
        className={`flex items-center h-14 px-3 border-b border-surface-overlay ${collapsed ? "justify-center" : "justify-between"}`}
      >
        {!collapsed && (
          <span className="font-semibold text-text-primary truncate">
            Dev Tools
          </span>
        )}
        <button
          onClick={onToggle}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="p-1.5 rounded-md text-text-secondary hover:text-text-primary hover:bg-surface-overlay transition-colors"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="w-5 h-5"
          >
            {collapsed ? (
              <path d="M9 18l6-6-6-6" />
            ) : (
              <path d="M15 18l-6-6 6-6" />
            )}
          </svg>
        </button>
      </div>

      {/* Nav links */}
      <nav className="flex-1 py-3 overflow-y-auto">
        {tools.map((tool) => (
          <NavLink
            key={tool.path}
            to={tool.path}
            title={collapsed ? tool.label : undefined}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 mx-2 rounded-lg transition-colors text-sm ${
                collapsed ? "justify-center" : ""
              } ${
                isActive
                  ? "bg-accent-muted text-accent-hover"
                  : "text-text-secondary hover:text-text-primary hover:bg-surface-overlay"
              }`
            }
          >
            <span className="shrink-0">{tool.icon}</span>
            {!collapsed && <span className="truncate">{tool.label}</span>}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
