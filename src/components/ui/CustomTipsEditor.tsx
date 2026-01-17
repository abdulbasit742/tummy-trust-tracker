import React, { useState } from 'react';
import { Button } from './button';
import { Input } from './input';
import { Plus, Trash2, X, Save, Lightbulb } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CustomTipsEditorProps {
  tips: string[];
  onSave: (tips: string[]) => Promise<void>;
  onCancel: () => void;
  isSaving: boolean;
}

const MAX_TIPS = 7;
const MAX_TIP_LENGTH = 150;

export function CustomTipsEditor({ tips, onSave, onCancel, isSaving }: CustomTipsEditorProps) {
  const [editTips, setEditTips] = useState<string[]>(tips.length > 0 ? [...tips] : ['']);

  const handleAddTip = () => {
    if (editTips.length < MAX_TIPS) {
      setEditTips([...editTips, '']);
    }
  };

  const handleRemoveTip = (index: number) => {
    setEditTips(editTips.filter((_, i) => i !== index));
  };

  const handleChangeTip = (index: number, value: string) => {
    const limited = value.slice(0, MAX_TIP_LENGTH);
    const newTips = [...editTips];
    newTips[index] = limited;
    setEditTips(newTips);
  };

  const handleSave = () => {
    // Filter out empty tips
    const validTips = editTips.filter(t => t.trim().length > 0);
    onSave(validTips);
  };

  const hasValidTips = editTips.some(t => t.trim().length > 0);

  return (
    <div className="bg-card rounded-2xl p-5 border border-border shadow-soft animate-slide-up space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Lightbulb className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-display font-bold text-foreground text-lg">Custom Tips</h3>
            <p className="text-xs text-muted-foreground">Add your own motivational messages</p>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={onCancel} className="rounded-xl h-10 w-10 p-0">
          <X className="w-4 h-4" />
        </Button>
      </div>

      <div className="space-y-3">
        {editTips.map((tip, index) => (
          <div key={index} className="flex items-start gap-2">
            <div className="flex-1 relative">
              <Input
                value={tip}
                onChange={(e) => handleChangeTip(index, e.target.value)}
                placeholder={`Tip ${index + 1}: e.g., "Stay calm, you're doing great! 💪"`}
                className="h-12 pr-12 text-sm"
                maxLength={MAX_TIP_LENGTH}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                {tip.length}/{MAX_TIP_LENGTH}
              </span>
            </div>
            {editTips.length > 1 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleRemoveTip(index)}
                className="h-12 w-12 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        ))}
      </div>

      {editTips.length < MAX_TIPS && (
        <Button
          variant="outline"
          onClick={handleAddTip}
          className="w-full h-12 rounded-xl border-dashed border-2"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Tip ({editTips.length}/{MAX_TIPS})
        </Button>
      )}

      <p className="text-xs text-muted-foreground text-center">
        ✨ Your custom tips will appear randomly alongside default tips
      </p>

      <Button
        onClick={handleSave}
        disabled={isSaving}
        className="w-full h-14 rounded-xl gradient-calm text-primary-foreground border-0 shadow-soft font-semibold text-base active:scale-[0.98] transition-transform"
      >
        <Save className="w-5 h-5 mr-2" />
        {isSaving ? 'Saving...' : 'Save Tips'}
      </Button>
    </div>
  );
}