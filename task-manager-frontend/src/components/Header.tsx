import { Link } from "react-router-dom";

export function Header() {
  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
        <Link
          to="/"
          className="text-xl font-semibold text-gray-800 hover:text-gray-600 transition-colors"
        >
          Task Manager
        </Link>
      </div>
    </header>
  );
}
