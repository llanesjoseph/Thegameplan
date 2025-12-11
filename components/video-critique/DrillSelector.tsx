'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, Trash2, Search, ChevronDown, Dumbbell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select-radix';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { DrillRecommendation, Drill } from '@/types/video-critique';
import { searchDrills } from '@/lib/data/drills';

interface DrillSelectorProps {
  sport: string;
  recommendations: DrillRecommendation[];
  onAdd: (drill: DrillRecommendation) => void;
  onUpdate: (index: number, updates: Partial<DrillRecommendation>) => void;
  onRemove: (index: number) => void;
  readOnly?: boolean;
}

export default function DrillSelector({
  sport,
  recommendations,
  onAdd,
  onUpdate,
  onRemove,
  readOnly = false,
}: DrillSelectorProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('');
  const [availableDrills, setAvailableDrills] = useState<Drill[]>([]);
  const [loading, setLoading] = useState(false);

  // Load drills when dialog opens
  useEffect(() => {
    if (isDialogOpen) {
      loadDrills();
    }
  }, [isDialogOpen, sport, selectedCategory, selectedDifficulty, searchTerm]);

  const loadDrills = async () => {
    setLoading(true);
    try {
      const { drills } = await searchDrills({
        sport,
        category: selectedCategory || undefined,
        difficultyLevel: selectedDifficulty as any || undefined,
        searchTerm: searchTerm || undefined,
        limitCount: 50,
      });
      setAvailableDrills(drills);
    } catch (error) {
      console.error('Error loading drills:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectDrill = useCallback((drill: Drill) => {
    const recommendation: DrillRecommendation = {
      drillId: drill.id,
      drillName: drill.name,
      priority: 'medium',
      notes: '',
      reps: drill.defaultReps,
      sets: drill.defaultSets,
      videoUrl: drill.videoUrl,
    };
    onAdd(recommendation);
    setIsDialogOpen(false);
    setSearchTerm('');
  }, [onAdd]);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getDifficultyBadge = (level: string) => {
    const colors = {
      beginner: 'bg-green-100 text-green-700',
      intermediate: 'bg-yellow-100 text-yellow-700',
      advanced: 'bg-red-100 text-red-700',
    };
    return colors[level as keyof typeof colors] || 'bg-gray-100 text-gray-700';
  };

  return (
    <div className="space-y-4">
      {/* Add Drill Button */}
      {!readOnly && (
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Add Drill Recommendation
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Select Drill</DialogTitle>
            </DialogHeader>

            {/* Search and Filters */}
            <div className="space-y-3 mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search drills..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              <div className="flex gap-2">
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Categories</SelectItem>
                    <SelectItem value="shooting">Shooting</SelectItem>
                    <SelectItem value="dribbling">Dribbling</SelectItem>
                    <SelectItem value="defense">Defense</SelectItem>
                    <SelectItem value="conditioning">Conditioning</SelectItem>
                    <SelectItem value="footwork">Footwork</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={selectedDifficulty} onValueChange={setSelectedDifficulty}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="All Levels" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Levels</SelectItem>
                    <SelectItem value="beginner">Beginner</SelectItem>
                    <SelectItem value="intermediate">Intermediate</SelectItem>
                    <SelectItem value="advanced">Advanced</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Drills List */}
            {loading ? (
              <div className="py-8 text-center text-gray-500">Loading drills...</div>
            ) : availableDrills.length === 0 ? (
              <div className="py-8 text-center text-gray-500">No drills found</div>
            ) : (
              <div className="space-y-2">
                {availableDrills.map((drill) => (
                  <div
                    key={drill.id}
                    className="border rounded-lg p-3 hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => handleSelectDrill(drill)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium">{drill.name}</h4>
                        <p className="text-sm text-gray-600 mt-1">{drill.description}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className={`px-2 py-1 text-xs rounded ${getDifficultyBadge(drill.difficultyLevel)}`}>
                            {drill.difficultyLevel}
                          </span>
                          <span className="text-xs text-gray-500">
                            {drill.category}
                          </span>
                          {drill.duration && (
                            <span className="text-xs text-gray-500">
                              {drill.duration} min
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </DialogContent>
        </Dialog>
      )}

      {/* Recommendations List */}
      {recommendations.length === 0 ? (
        <div className="text-center py-6 text-gray-500">
          <Dumbbell className="h-12 w-12 mx-auto mb-3 text-gray-300" />
          <p>No drill recommendations added yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {recommendations.map((rec, index) => (
            <div key={index} className="border rounded-lg p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h4 className="font-medium text-lg">{rec.drillName}</h4>
                  <div className="flex items-center gap-3 mt-2">
                    {/* Priority */}
                    {!readOnly ? (
                      <Select
                        value={rec.priority}
                        onValueChange={(value) => onUpdate(index, { priority: value as any })}
                      >
                        <SelectTrigger className={`w-32 h-8 ${getPriorityColor(rec.priority)}`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="high">High Priority</SelectItem>
                          <SelectItem value="medium">Medium Priority</SelectItem>
                          <SelectItem value="low">Low Priority</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <span className={`px-3 py-1 text-sm rounded-full border ${getPriorityColor(rec.priority)}`}>
                        {rec.priority} priority
                      </span>
                    )}

                    {/* Reps and Sets */}
                    <div className="flex items-center gap-2">
                      {!readOnly ? (
                        <>
                          <Input
                            type="number"
                            value={rec.reps || ''}
                            onChange={(e) => onUpdate(index, { reps: parseInt(e.target.value) || undefined })}
                            placeholder="Reps"
                            className="w-20 h-8"
                          />
                          <span className="text-sm text-gray-500">x</span>
                          <Input
                            type="number"
                            value={rec.sets || ''}
                            onChange={(e) => onUpdate(index, { sets: parseInt(e.target.value) || undefined })}
                            placeholder="Sets"
                            className="w-20 h-8"
                          />
                        </>
                      ) : (
                        <span className="text-sm">
                          {rec.reps && rec.sets ? `${rec.reps} reps x ${rec.sets} sets` : 'No reps/sets specified'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {!readOnly && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onRemove(index)}
                    className="text-gray-400 hover:text-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>

              {/* Notes */}
              <div>
                {!readOnly ? (
                  <>
                    <label className="block text-sm font-medium mb-1">
                      Coach Notes
                    </label>
                    <Textarea
                      value={rec.notes}
                      onChange={(e) => onUpdate(index, { notes: e.target.value })}
                      placeholder="Add specific instructions or modifications..."
                      className="min-h-[60px]"
                    />
                  </>
                ) : (
                  rec.notes && (
                    <div className="bg-gray-50 rounded p-3 mt-2">
                      <p className="text-sm">{rec.notes}</p>
                    </div>
                  )
                )}
              </div>

              {/* Video Link */}
              {rec.videoUrl && (
                <div className="mt-2">
                  <a
                    href={rec.videoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:underline"
                  >
                    View drill video →
                  </a>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Summary */}
      {recommendations.length > 0 && (
        <div className="mt-4 pt-4 border-t text-sm text-gray-600">
          <div className="flex items-center justify-between">
            <span>
              Total drills: {recommendations.length}
            </span>
            <div className="flex items-center gap-3">
              <span className="text-red-600">
                High: {recommendations.filter(r => r.priority === 'high').length}
              </span>
              <span className="text-yellow-600">
                Medium: {recommendations.filter(r => r.priority === 'medium').length}
              </span>
              <span className="text-green-600">
                Low: {recommendations.filter(r => r.priority === 'low').length}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}