'use client';

import { useState, useCallback, useMemo } from 'react';
import { Star } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Rubric, RubricScore, RubricCriteria } from '@/types/video-critique';

interface RubricScoringProps {
  rubric: Rubric;
  scores: RubricScore[];
  onChange: (scores: RubricScore[]) => void;
  readOnly?: boolean;
}

export default function RubricScoring({
  rubric,
  scores,
  onChange,
  readOnly = false,
}: RubricScoringProps) {
  const [hoveredCriteria, setHoveredCriteria] = useState<string | null>(null);
  const [hoveredScore, setHoveredScore] = useState<number | null>(null);

  // Create a map of existing scores for easy lookup
  const scoreMap = useMemo(() => {
    const map = new Map<string, RubricScore>();
    scores.forEach(score => map.set(score.criteriaId, score));
    return map;
  }, [scores]);

  // Handle score change for a criteria
  const handleScoreChange = useCallback(
    (criteriaId: string, newScore: number) => {
      if (readOnly) return;

      const existingScore = scoreMap.get(criteriaId);
      const updatedScore: RubricScore = {
        criteriaId,
        score: newScore,
        notes: existingScore?.notes || '',
      };

      const newScores = scores.filter(s => s.criteriaId !== criteriaId);
      newScores.push(updatedScore);
      onChange(newScores);
    },
    [scores, scoreMap, onChange, readOnly]
  );

  // Handle notes change for a criteria
  const handleNotesChange = useCallback(
    (criteriaId: string, notes: string) => {
      if (readOnly) return;

      const existingScore = scoreMap.get(criteriaId);
      const updatedScore: RubricScore = {
        criteriaId,
        score: existingScore?.score || 0,
        notes,
      };

      const newScores = scores.filter(s => s.criteriaId !== criteriaId);
      newScores.push(updatedScore);
      onChange(newScores);
    },
    [scores, scoreMap, onChange, readOnly]
  );

  // Render star rating for a criteria
  const renderStars = (criteria: RubricCriteria) => {
    const currentScore = scoreMap.get(criteria.id)?.score || 0;
    const stars = [];

    for (let i = 1; i <= 5; i++) {
      const isHovered = hoveredCriteria === criteria.id && hoveredScore !== null && i <= hoveredScore;
      const isFilled = i <= currentScore;

      stars.push(
        <button
          key={i}
          type="button"
          disabled={readOnly}
          className={`p-1 transition-colors ${
            readOnly ? 'cursor-default' : 'cursor-pointer hover:scale-110'
          }`}
          onClick={() => handleScoreChange(criteria.id, i)}
          onMouseEnter={() => {
            if (!readOnly) {
              setHoveredCriteria(criteria.id);
              setHoveredScore(i);
            }
          }}
          onMouseLeave={() => {
            setHoveredCriteria(null);
            setHoveredScore(null);
          }}
        >
          <Star
            className={`h-6 w-6 transition-colors ${
              isHovered || isFilled
                ? 'fill-yellow-400 text-yellow-400'
                : 'text-gray-300'
            }`}
          />
        </button>
      );
    }

    return stars;
  };

  // Get score description for current score
  const getScoreDescription = (criteria: RubricCriteria, score: number): string => {
    if (score === 0) return 'Not scored';
    const descriptions = criteria.scoreDescriptions as any;
    return descriptions[score] || '';
  };

  // Calculate weighted average
  const weightedAverage = useMemo(() => {
    let totalWeightedScore = 0;
    let totalWeight = 0;

    rubric.criteria.forEach(criteria => {
      const score = scoreMap.get(criteria.id);
      if (score && score.score > 0) {
        const weight = criteria.weight || 1;
        totalWeightedScore += score.score * weight;
        totalWeight += weight;
      }
    });

    return totalWeight > 0 ? (totalWeightedScore / totalWeight).toFixed(2) : '0.00';
  }, [rubric.criteria, scoreMap]);

  return (
    <div className="space-y-6">
      {/* Overall Score Display */}
      <div className="bg-blue-50 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-lg">Overall Assessment</h3>
            <p className="text-sm text-gray-600 mt-1">
              Based on weighted criteria scores
            </p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-blue-600">{weightedAverage}</div>
            <div className="text-sm text-gray-600">out of 5.00</div>
          </div>
        </div>
      </div>

      {/* Criteria Scoring */}
      <div className="space-y-4">
        {rubric.criteria.map((criteria, index) => {
          const score = scoreMap.get(criteria.id);
          const currentScore = score?.score || 0;

          return (
            <div
              key={criteria.id}
              className="border rounded-lg p-4 hover:shadow-sm transition-shadow"
            >
              {/* Criteria Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h4 className="font-semibold text-lg">{criteria.name}</h4>
                  <p className="text-sm text-gray-600 mt-1">{criteria.description}</p>
                  {criteria.weight && criteria.weight !== 1 && (
                    <span className="inline-block mt-2 px-2 py-1 bg-gray-100 text-xs rounded">
                      Weight: {criteria.weight}x
                    </span>
                  )}
                </div>
              </div>

              {/* Star Rating */}
              <div className="flex items-center gap-4 mb-3">
                <div className="flex">{renderStars(criteria)}</div>
                <span className="text-sm font-medium">
                  {currentScore > 0 ? `${currentScore}/5` : 'Not scored'}
                </span>
              </div>

              {/* Score Description */}
              {currentScore > 0 && (
                <div className="bg-gray-50 rounded p-2 mb-3">
                  <p className="text-sm text-gray-700">
                    {getScoreDescription(criteria, currentScore)}
                  </p>
                </div>
              )}

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium mb-1">
                  Notes (optional)
                </label>
                <Textarea
                  value={score?.notes || ''}
                  onChange={(e) => handleNotesChange(criteria.id, e.target.value)}
                  placeholder="Add specific feedback for this criteria..."
                  className="min-h-[60px]"
                  disabled={readOnly}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      {!readOnly && (
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-medium mb-2">Scoring Guide</h4>
          <div className="grid grid-cols-5 gap-2 text-xs">
            <div className="text-center">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 mx-auto mb-1" />
              <span>Needs Work</span>
            </div>
            <div className="text-center">
              <div className="flex justify-center mb-1">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              </div>
              <span>Below Average</span>
            </div>
            <div className="text-center">
              <div className="flex justify-center mb-1">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              </div>
              <span>Average</span>
            </div>
            <div className="text-center">
              <div className="flex justify-center mb-1">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              </div>
              <span>Above Average</span>
            </div>
            <div className="text-center">
              <div className="flex justify-center mb-1">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              </div>
              <span>Excellent</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}