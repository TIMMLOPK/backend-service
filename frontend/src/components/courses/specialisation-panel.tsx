"use client";

import { useState } from "react";
import {
  Sparkles,
  Target,
  AlertTriangle,
  Loader2,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { api, ApiError, getErrorMessage } from "@/lib/api";
import type { TrackSuggestion, WeakArea, CourseMaterial } from "@/lib/types";

interface SpecialisationPanelProps {
  courseId: string;
  onContentGenerated: () => void;
}

export function SpecialisationPanel({
  courseId,
  onContentGenerated,
}: SpecialisationPanelProps) {
  // Track suggestions
  const [tracks, setTracks] = useState<TrackSuggestion[] | null>(null);
  const [loadingTracks, setLoadingTracks] = useState(false);
  const [generatingTrack, setGeneratingTrack] = useState<string | null>(null);

  // Weak areas
  const [weakAreas, setWeakAreas] = useState<WeakArea[] | null>(null);
  const [loadingWeak, setLoadingWeak] = useState(false);
  const [generatingPractice, setGeneratingPractice] = useState<string | null>(null);

  const [error, setError] = useState<string | null>(null);

  const fetchTracks = async () => {
    setLoadingTracks(true);
    setError(null);
    try {
      const result = await api<TrackSuggestion[]>(
        `/api/v1/courses/${courseId}/suggest-tracks`,
        { method: "POST" },
      );
      setTracks(result);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(getErrorMessage(err.code));
      } else {
        setError("Failed to get suggestions.");
      }
    } finally {
      setLoadingTracks(false);
    }
  };

  const startTrack = async (track: TrackSuggestion) => {
    setGeneratingTrack(track.title);
    try {
      await api<CourseMaterial[]>(
        `/api/v1/courses/${courseId}/generate-track`,
        {
          method: "POST",
          body: JSON.stringify({
            title: track.title,
            subtopics: track.subtopics,
          }),
        },
      );
      onContentGenerated();
    } catch {
      setError("Failed to generate track content.");
    } finally {
      setGeneratingTrack(null);
    }
  };

  const fetchWeakAreas = async () => {
    setLoadingWeak(true);
    setError(null);
    try {
      const result = await api<WeakArea[]>(
        `/api/v1/courses/${courseId}/weak-areas`,
      );
      setWeakAreas(result);
    } catch {
      setError("Failed to fetch weak areas.");
    } finally {
      setLoadingWeak(false);
    }
  };

  const practiceWeakArea = async (subtopic: string) => {
    setGeneratingPractice(subtopic);
    try {
      await api<CourseMaterial[]>(
        `/api/v1/courses/${courseId}/generate-weak-practice`,
        {
          method: "POST",
          body: JSON.stringify({ subtopic_title: subtopic }),
        },
      );
      onContentGenerated();
    } catch {
      setError("Failed to generate practice content.");
    } finally {
      setGeneratingPractice(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-base font-semibold flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          Specialisation
        </h3>
        <p className="text-sm text-muted-foreground mt-1">
          You&apos;ve made great progress! Explore specialisation options below.
        </p>
      </div>

      {error && (
        <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Learning Tracks */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold flex items-center gap-1.5">
            <Target className="h-4 w-4 text-primary/80" />
            Learning Tracks
          </h4>
          {!tracks && (
            <Button
              size="sm"
              variant="secondary"
              onClick={fetchTracks}
              disabled={loadingTracks}
            >
              {loadingTracks ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Suggest Tracks"
              )}
            </Button>
          )}
        </div>

        {tracks && tracks.length > 0 && (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {tracks.map((track) => (
              <div
                key={track.title}
                className="rounded-xl border border-gray-200 p-4 space-y-2"
              >
                <h5 className="font-medium text-gray-900 text-sm">
                  {track.title}
                </h5>
                <p className="text-xs text-gray-500">{track.description}</p>
                <div className="flex flex-wrap gap-1">
                  {track.subtopics.map((s) => (
                    <span
                      key={s}
                      className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary"
                    >
                      {s}
                    </span>
                  ))}
                </div>
                <Button
                  size="sm"
                  onClick={() => startTrack(track)}
                  disabled={generatingTrack !== null}
                  className="w-full mt-2"
                >
                  {generatingTrack === track.title ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <ArrowRight className="h-4 w-4" />
                  )}
                  {generatingTrack === track.title
                    ? "Generating..."
                    : "Start Track"}
                </Button>
              </div>
            ))}
          </div>
        )}

        {tracks && tracks.length === 0 && (
          <p className="text-sm text-muted-foreground">
            No track suggestions available.
          </p>
        )}
      </div>

      {/* Weak Areas */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold flex items-center gap-1.5">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            Strengthen Weak Areas
          </h4>
          {!weakAreas && (
            <Button
              size="sm"
              variant="secondary"
              onClick={fetchWeakAreas}
              disabled={loadingWeak}
            >
              {loadingWeak ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Check Weak Areas"
              )}
            </Button>
          )}
        </div>

        {weakAreas && weakAreas.length > 0 && (
          <div className="space-y-2">
            {weakAreas.map((area) => (
              <div
                key={area.subtopic_title}
                className="flex items-center justify-between rounded-lg bg-amber-50 border border-amber-200 px-4 py-3"
              >
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {area.subtopic_title}
                  </p>
                  <p className="text-xs text-amber-600">
                    Average score: {area.average_score_pct}%
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => practiceWeakArea(area.subtopic_title)}
                  disabled={generatingPractice !== null}
                >
                  {generatingPractice === area.subtopic_title ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Practice"
                  )}
                </Button>
              </div>
            ))}
          </div>
        )}

        {weakAreas && weakAreas.length === 0 && (
          <p className="text-sm text-green-600">
            No weak areas detected — great job!
          </p>
        )}
      </div>
    </div>
  );
}
