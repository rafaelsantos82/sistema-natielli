import { ArrowLeft, Plus, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useState, useEffect, ReactNode } from 'react';

interface SecondaryAction {
  label: string;
  onClick: () => void;
  icon?: ReactNode;
}

interface PageToolbarProps {
  title?: string;
  onBack?: () => void;
  /** Quando definido, exibe botão outline com ícone e texto (ex.: "Voltar") em vez de só o ícone. */
  backLabel?: string;
  onAdd?: () => void;
  onSearch?: (query: string) => void;
  addButtonText?: string;
  showBack?: boolean;
  showAdd?: boolean;
  showSearch?: boolean;
  secondaryAction?: SecondaryAction;
}

export const PageToolbar = ({
  title,
  onBack,
  backLabel,
  onAdd,
  onSearch,
  addButtonText = 'Adicionar',
  showBack = true,
  showAdd = true,
  showSearch = true,
  secondaryAction,
}: PageToolbarProps) => {
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!onSearch) return;
    
    const timer = setTimeout(() => {
      onSearch(searchQuery);
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery, onSearch]);

  return (
    <div className="flex items-center gap-4 mb-6">
      {showBack && onBack && (
        backLabel ? (
          <Button variant="outline" onClick={onBack} className="shrink-0">
            <ArrowLeft className="h-4 w-4 mr-2" />
            {backLabel}
          </Button>
        ) : (
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="shrink-0"
            aria-label="Voltar"
          >
            <ArrowLeft />
          </Button>
        )
      )}

      {showSearch && onSearch && (
        <div className="flex-1 max-w-md mx-auto">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              type="text"
              placeholder="Buscar..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      )}

      <div className="flex items-center gap-2 ml-auto">
        {secondaryAction && (
          <Button
            variant="outline"
            onClick={secondaryAction.onClick}
            className="shrink-0"
            aria-label={secondaryAction.label}
          >
            {secondaryAction.icon ?? <Plus className="mr-2 h-4 w-4" />}
            {secondaryAction.label}
          </Button>
        )}

        {showAdd && onAdd && (
          <Button
            onClick={onAdd}
            className="shrink-0"
            aria-label={addButtonText}
          >
            <Plus className="mr-2 h-4 w-4" />
            {addButtonText}
          </Button>
        )}
      </div>
    </div>
  );
};
