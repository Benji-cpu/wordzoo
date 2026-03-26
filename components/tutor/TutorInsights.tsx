'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';

interface TutorInsightsProps {
  languageId: string;
}

interface ProfileData {
  proficiency_estimate: string;
  session_count: number;
  total_messages: number;
  total_practice_minutes: number;
  topics_covered: string[];
  weakness_patterns: string[];
}

const PROFICIENCY_LABELS: Record<string, string> = {
  beginner: 'Beginner',
  elementary: 'Elementary',
  intermediate: 'Intermediate',
  upper_intermediate: 'Upper Intermediate',
  advanced: 'Advanced',
};

export function TutorInsights({ languageId }: TutorInsightsProps) {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await fetch(`/api/tutor/profile?languageId=${languageId}`);
        if (res.ok) {
          const json = await res.json();
          if (json.data) setProfile(json.data);
        }
      } catch {
        // Non-critical
      } finally {
        setIsLoading(false);
      }
    }
    fetchProfile();
  }, [languageId]);

  if (isLoading) return null;

  // Don't show until user has at least 1 session
  if (!profile || profile.session_count === 0) {
    return (
      <Card className="animate-fade-in">
        <div className="text-center py-2">
          <p className="text-sm text-text-secondary">
            Complete a tutor session to see your learner profile
          </p>
        </div>
      </Card>
    );
  }

  const topics = Array.isArray(profile.topics_covered) ? profile.topics_covered.slice(0, 5) : [];
  const weaknesses = Array.isArray(profile.weakness_patterns) ? profile.weakness_patterns.slice(0, 3) : [];

  return (
    <Card className="animate-fade-in">
      <h3 className="text-sm font-medium text-foreground mb-3">Tutor Insights</h3>

      <div className="grid grid-cols-3 gap-3 mb-3">
        <div className="text-center">
          <div className="text-lg font-bold text-accent-default">
            {PROFICIENCY_LABELS[profile.proficiency_estimate] ?? profile.proficiency_estimate}
          </div>
          <div className="text-xs text-text-secondary">level</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold text-accent-default">{profile.session_count}</div>
          <div className="text-xs text-text-secondary">sessions</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold text-accent-default">{profile.total_practice_minutes}</div>
          <div className="text-xs text-text-secondary">minutes</div>
        </div>
      </div>

      {topics.length > 0 && (
        <div className="mb-2">
          <div className="text-xs font-medium text-text-secondary mb-1">Topics covered</div>
          <div className="flex flex-wrap gap-1">
            {topics.map((t) => (
              <span key={t} className="px-2 py-0.5 rounded-full bg-accent-default/10 text-accent-default text-xs">
                {t}
              </span>
            ))}
          </div>
        </div>
      )}

      {weaknesses.length > 0 && (
        <div>
          <div className="text-xs font-medium text-text-secondary mb-1">Areas to improve</div>
          <div className="flex flex-wrap gap-1">
            {weaknesses.map((w) => (
              <span key={w} className="px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 text-xs">
                {w}
              </span>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}
