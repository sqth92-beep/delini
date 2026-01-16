import { Search } from "lucide-react";
import { useState } from "react";
import { useI18n } from "@/lib/i18n";
import { usePreviewNavigate } from "@/lib/preview-context";

export function SearchBar({ initialValue = "" }: { initialValue?: string }) {
  const { t } = useI18n();
  const [value, setValue] = useState(initialValue);
  const navigate = usePreviewNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value.trim()) {
      navigate(`/search?q=${encodeURIComponent(value.trim())}`);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="relative w-full group">
      <div className="
        relative flex items-center w-full h-14 rounded-2xl
        bg-card shadow-lg border border-border/50
        focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/10
        transition-all duration-300
      ">
        <div className="grid place-items-center h-full w-14 text-muted-foreground group-focus-within:text-primary transition-colors">
          <Search className="w-6 h-6" />
        </div>
        <input
          className="peer h-full w-full outline-none text-base text-foreground placeholder:text-muted-foreground bg-transparent ml-4 font-medium"
          type="text"
          id="search"
          placeholder={t("search.placeholder")}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          data-testid="input-search"
        />
        <button 
          type="submit"
          className="
            absolute left-2 bg-primary text-white p-2.5 rounded-xl
            hover:bg-primary/90 hover:scale-105 active:scale-95
            transition-all duration-200
            shadow-lg shadow-primary/20
          "
          data-testid="button-search"
        >
          {t("search.button")}
        </button>
      </div>
    </form>
  );
}
