'use client';

import { useCallback } from 'react';
import { Trash2, Clock, ThumbsUp, AlertCircle, HelpCircle, PlayCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select-radix';
import { Timecode, TimecodeType } from '@/types/video-critique';
import { formatTimecode } from '@/lib/data/reviews';

interface TimecodeEditorProps {
  timecodes: Timecode[];
  onUpdate: (id: string, updates: Partial<Timecode>) => void;
  onDelete: (id: string) => void;
  onSeek: (timestamp: number) => void;
  readOnly?: boolean;
}

export default function TimecodeEditor({
  timecodes,
  onUpdate,
  onDelete,
  onSeek,
  readOnly = false,
}: TimecodeEditorProps) {
  const getTypeIcon = useCallback((type: TimecodeType) => {
    switch (type) {
      case 'praise':
        return <ThumbsUp className="h-4 w-4 text-green-600" />;
      case 'correction':
        return <AlertCircle className="h-4 w-4 text-orange-600" />;
      case 'question':
        return <HelpCircle className="h-4 w-4 text-blue-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  }, []);

  const getTypeColor = useCallback((type: TimecodeType) => {
    switch (type) {
      case 'praise':
        return 'border-green-200 bg-green-50';
      case 'correction':
        return 'border-orange-200 bg-orange-50';
      case 'question':
        return 'border-blue-200 bg-blue-50';
      default:
        return 'border-gray-200 bg-gray-50';
    }
  }, []);

  const sortedTimecodes = [...timecodes].sort((a, b) => a.timestamp - b.timestamp);

  if (timecodes.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <Clock className="h-12 w-12 mx-auto mb-3 text-gray-300" />
        <p>No timecodes added yet</p>
        <p className="text-sm mt-1">
          Use the "Add Timecode" button while watching the video
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {sortedTimecodes.map((timecode) => (
        <div
          key={timecode.id}
          className={`border rounded-lg p-4 transition-all hover:shadow-sm ${getTypeColor(
            timecode.type
          )}`}
        >
          <div className="flex items-start gap-3">
            {/* Timestamp and type */}
            <div className="flex flex-col items-center gap-2 min-w-[100px]">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onSeek(timecode.timestamp)}
                className="flex items-center gap-2 hover:bg-white"
                title="Jump to this time in video"
              >
                <PlayCircle className="h-4 w-4" />
                {formatTimecode(timecode.timestamp)}
              </Button>

              {!readOnly ? (
                <Select
                  value={timecode.type}
                  onValueChange={(value: TimecodeType) =>
                    onUpdate(timecode.id, { type: value })
                  }
                >
                  <SelectTrigger className="w-full h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="praise">
                      <div className="flex items-center gap-2">
                        <ThumbsUp className="h-3 w-3 text-green-600" />
                        Praise
                      </div>
                    </SelectItem>
                    <SelectItem value="correction">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="h-3 w-3 text-orange-600" />
                        Correction
                      </div>
                    </SelectItem>
                    <SelectItem value="question">
                      <div className="flex items-center gap-2">
                        <HelpCircle className="h-3 w-3 text-blue-600" />
                        Question
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <div className="flex items-center gap-2 px-2 py-1 bg-white rounded text-sm">
                  {getTypeIcon(timecode.type)}
                  <span className="capitalize">{timecode.type}</span>
                </div>
              )}
            </div>

            {/* Comment */}
            <div className="flex-1">
              {!readOnly ? (
                <Textarea
                  value={timecode.comment}
                  onChange={(e) => onUpdate(timecode.id, { comment: e.target.value })}
                  placeholder={`Add ${timecode.type} feedback...`}
                  className="min-h-[80px] bg-white"
                />
              ) : (
                <div className="bg-white rounded-lg p-3">
                  <p className="whitespace-pre-wrap">{timecode.comment || 'No comment'}</p>
                </div>
              )}
            </div>

            {/* Delete button */}
            {!readOnly && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(timecode.id)}
                className="text-gray-400 hover:text-red-600"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      ))}

      {/* Summary */}
      <div className="mt-4 pt-4 border-t flex items-center justify-between text-sm text-gray-600">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1">
            <ThumbsUp className="h-4 w-4 text-green-600" />
            {timecodes.filter(tc => tc.type === 'praise').length} Praise
          </span>
          <span className="flex items-center gap-1">
            <AlertCircle className="h-4 w-4 text-orange-600" />
            {timecodes.filter(tc => tc.type === 'correction').length} Corrections
          </span>
          <span className="flex items-center gap-1">
            <HelpCircle className="h-4 w-4 text-blue-600" />
            {timecodes.filter(tc => tc.type === 'question').length} Questions
          </span>
        </div>
        <span>Total: {timecodes.length} timecodes</span>
      </div>
    </div>
  );
}