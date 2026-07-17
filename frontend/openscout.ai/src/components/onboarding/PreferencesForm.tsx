import React, { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { MultiSelectField } from './MultiSelectField';
import { ExperienceSelector } from './ExperienceSelector';
import { DifficultySelector } from './DifficultySelector';
import { Button } from '../ui/Button';
import { UserPreferences } from '../../types';
import {
  ALL_PROGRAMMING_LANGUAGES,
  ALL_FRAMEWORKS_AND_TOOLS,
  ALL_AREAS_OF_INTEREST,
  CONTRIBUTION_GOALS,
} from '../../lib/mock-data';
import { Sliders, RefreshCw, AlertCircle } from 'lucide-react';

const preferencesSchema = z.object({
  languages: z.array(z.string()).min(1, 'Please select at least one programming language.'),
  frameworks: z.array(z.string()),
  interests: z.array(z.string()).min(1, 'Please select at least one area of interest.'),
  experienceLevel: z.enum(['beginner', 'intermediate', 'advanced']),
  preferredDifficulties: z.array(z.enum(['beginner', 'moderate', 'challenging'])).min(1, 'Please select at least one preferred difficulty.'),
  contributionGoals: z.array(z.string()),
});

type PreferencesFormValues = z.infer<typeof preferencesSchema>;

interface PreferencesFormProps {
  initialValues?: UserPreferences;
  onSubmit: (data: UserPreferences) => Promise<void>;
  onReanalyze?: () => void;
  isSubmitting?: boolean;
}

export function PreferencesForm({
  initialValues,
  onSubmit,
  onReanalyze,
  isSubmitting = false,
}: PreferencesFormProps) {
  const defaultValues: PreferencesFormValues = initialValues || {
    languages: [],
    frameworks: [],
    interests: [],
    experienceLevel: 'intermediate',
    preferredDifficulties: ['beginner', 'moderate'],
    contributionGoals: [],
  };

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<PreferencesFormValues>({
    resolver: zodResolver(preferencesSchema),
    defaultValues,
  });

  const handleFormSubmit = async (data: PreferencesFormValues) => {
    await onSubmit(data as UserPreferences);
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-8 font-sans">
      <div className="space-y-6">
        {/* 1. Programming Languages */}
        <Controller
          name="languages"
          control={control}
          render={({ field }) => (
            <MultiSelectField
              label="1. Programming Languages (Select one or more)"
              options={ALL_PROGRAMMING_LANGUAGES}
              selectedValues={field.value}
              onChange={field.onChange}
              error={errors.languages?.message}
              badgeVariant="blue"
            />
          )}
        />

        {/* 2. Frameworks & Tools */}
        <Controller
          name="frameworks"
          control={control}
          render={({ field }) => (
            <MultiSelectField
              label="2. Frameworks and Tools"
              options={ALL_FRAMEWORKS_AND_TOOLS}
              selectedValues={field.value}
              onChange={field.onChange}
              error={errors.frameworks?.message}
              badgeVariant="violet"
            />
          )}
        />

        {/* 3. Areas of Interest */}
        <Controller
          name="interests"
          control={control}
          render={({ field }) => (
            <MultiSelectField
              label="3. Areas of Interest (Select one or more)"
              options={ALL_AREAS_OF_INTEREST}
              selectedValues={field.value}
              onChange={field.onChange}
              error={errors.interests?.message}
              badgeVariant="orange"
            />
          )}
        />

        {/* 4. Experience Level */}
        <Controller
          name="experienceLevel"
          control={control}
          render={({ field }) => (
            <ExperienceSelector
              value={field.value}
              onChange={field.onChange}
              error={errors.experienceLevel?.message}
            />
          )}
        />

        {/* 5. Preferred Difficulty */}
        <Controller
          name="preferredDifficulties"
          control={control}
          render={({ field }) => (
            <DifficultySelector
              selectedValues={field.value}
              onChange={field.onChange}
              error={errors.preferredDifficulties?.message}
            />
          )}
        />

        {/* 6. Contribution Goals */}
        <Controller
          name="contributionGoals"
          control={control}
          render={({ field }) => (
            <MultiSelectField
              label="6. Contribution Goals (Optional)"
              options={CONTRIBUTION_GOALS}
              selectedValues={field.value}
              onChange={field.onChange}
              badgeVariant="blue"
            />
          )}
        />
      </div>

      {/* Form Action Buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-900 pt-6">
        {onReanalyze ? (
          <Button
            type="button"
            variant="outline"
            className="w-full sm:w-auto flex gap-1.5"
            onClick={onReanalyze}
          >
            <RefreshCw className="w-4 h-4 text-slate-400" />
            <span>Re-analyze GitHub Profile</span>
          </Button>
        ) : (
          <div />
        )}

        <Button
          type="submit"
          variant="primary"
          className="w-full sm:w-auto flex gap-1.5 min-w-[200px]"
          isLoading={isSubmitting}
        >
          <Sliders className="w-4 h-4" />
          <span>Generate My Recommendations</span>
        </Button>
      </div>
    </form>
  );
}
