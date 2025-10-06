'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Label } from './ui/label'
import { Input } from './ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Badge } from './ui/badge'
import { Calculator, DollarSign, TrendingUp, Info } from 'lucide-react'
import {
  type PricingModel,
  type ExperienceLevel,
  calculateEstimatedCost,
  getRecommendedRates,
  estimatePageCountFromWords,
  estimateWordCountFromPages,
  getPricingModelDisplayName,
  getExperienceLevelDisplayName,
} from '@/src/lib/pricing-utils'

interface PricingCalculatorProps {
  mode?: 'writer' | 'client'
  onPricingChange?: (pricing: any) => void
  initialValues?: {
    pricing_model?: PricingModel
    experience_level?: ExperienceLevel
  }
}

export function PricingCalculator({
  mode = 'writer',
  onPricingChange,
  initialValues,
}: PricingCalculatorProps) {
  const [pricingModel, setPricingModel] = useState<PricingModel>(
    initialValues?.pricing_model || 'per_word'
  )
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel>(
    initialValues?.experience_level || 'intermediate'
  )

  // Writer rates
  const [ratePerWord, setRatePerWord] = useState<number>(0.3)
  const [ratePerPage, setRatePerPage] = useState<number>(125)
  const [rateHourly, setRateHourly] = useState<number>(65)
  const [projectRateMin, setProjectRateMin] = useState<number>(15000)
  const [projectRateMax, setProjectRateMax] = useState<number>(30000)

  // Job estimates
  const [estimatedWordCount, setEstimatedWordCount] = useState<number>(50000)
  const [estimatedPageCount, setEstimatedPageCount] = useState<number>(182)
  const [estimatedHours, setEstimatedHours] = useState<number>(100)
  const [budget, setBudget] = useState<number>(25000)

  // Recommendations
  const recommendedRates = getRecommendedRates(experienceLevel, pricingModel)

  // Auto-sync word count and page count
  useEffect(() => {
    if (mode === 'client' && pricingModel === 'per_word') {
      const pages = estimatePageCountFromWords(estimatedWordCount)
      setEstimatedPageCount(pages)
    }
  }, [estimatedWordCount, pricingModel, mode])

  useEffect(() => {
    if (mode === 'client' && pricingModel === 'per_page') {
      const words = estimateWordCountFromPages(estimatedPageCount)
      setEstimatedWordCount(words)
    }
  }, [estimatedPageCount, pricingModel, mode])

  // Calculate cost
  const estimatedCost =
    mode === 'client'
      ? calculateEstimatedCost({
          pricing_model: pricingModel,
          estimated_word_count: estimatedWordCount,
          estimated_page_count: estimatedPageCount,
          estimated_hours: estimatedHours,
          rate_offered_per_word: ratePerWord,
          rate_offered_per_page: ratePerPage,
          rate_offered_hourly: rateHourly,
          budget,
        })
      : { min: 0, max: 0, display: '' }

  // Notify parent of pricing changes
  useEffect(() => {
    if (onPricingChange) {
      const pricing =
        mode === 'writer'
          ? {
              pricing_model: pricingModel,
              rate_per_word: pricingModel === 'per_word' ? ratePerWord : undefined,
              rate_per_page: pricingModel === 'per_page' ? ratePerPage : undefined,
              rate_hourly: pricingModel === 'hourly' ? rateHourly : undefined,
              project_rate_min: pricingModel === 'per_project' ? projectRateMin : undefined,
              project_rate_max: pricingModel === 'per_project' ? projectRateMax : undefined,
              experience_level: experienceLevel,
            }
          : {
              pricing_model: pricingModel,
              estimated_word_count: estimatedWordCount,
              estimated_page_count: estimatedPageCount,
              estimated_hours: estimatedHours,
              rate_offered_per_word: pricingModel === 'per_word' ? ratePerWord : undefined,
              rate_offered_per_page: pricingModel === 'per_page' ? ratePerPage : undefined,
              rate_offered_hourly: pricingModel === 'hourly' ? rateHourly : undefined,
              budget: pricingModel === 'per_project' ? budget : undefined,
            }

      onPricingChange(pricing)
    }
  }, [
    pricingModel,
    experienceLevel,
    ratePerWord,
    ratePerPage,
    rateHourly,
    projectRateMin,
    projectRateMax,
    estimatedWordCount,
    estimatedPageCount,
    estimatedHours,
    budget,
    mode,
    onPricingChange,
  ])

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="h-5 w-5" />
          {mode === 'writer' ? 'Set Your Rates' : 'Calculate Project Cost'}
        </CardTitle>
        <CardDescription>
          {mode === 'writer'
            ? 'Configure your pricing based on industry standards'
            : 'Estimate the cost of your ghostwriting project'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Pricing Model Selection */}
        <div className="space-y-2">
          <Label>Pricing Model</Label>
          <Select
            value={pricingModel}
            onValueChange={value => setPricingModel(value as PricingModel)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="per_word">Per Word (Industry Standard)</SelectItem>
              <SelectItem value="per_page">Per Page</SelectItem>
              <SelectItem value="per_project">Per Project</SelectItem>
              <SelectItem value="hourly">Hourly</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Experience Level (Writer only) */}
        {mode === 'writer' && (
          <div className="space-y-2">
            <Label>Experience Level</Label>
            <Select
              value={experienceLevel}
              onValueChange={value => setExperienceLevel(value as ExperienceLevel)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="beginner">
                  {getExperienceLevelDisplayName('beginner')}
                </SelectItem>
                <SelectItem value="intermediate">
                  {getExperienceLevelDisplayName('intermediate')}
                </SelectItem>
                <SelectItem value="professional">
                  {getExperienceLevelDisplayName('professional')}
                </SelectItem>
                <SelectItem value="expert">{getExperienceLevelDisplayName('expert')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Per Word Pricing */}
        {pricingModel === 'per_word' && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>
                {mode === 'writer' ? 'Your Rate Per Word' : 'Rate Per Word'}
                <Badge variant="outline" className="ml-2">
                  Industry: ${recommendedRates.min.toFixed(2)}-${recommendedRates.max.toFixed(2)}
                </Badge>
              </Label>
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <Input
                  type="number"
                  step="0.01"
                  min="0.01"
                  max="10"
                  value={ratePerWord}
                  onChange={e => setRatePerWord(parseFloat(e.target.value) || 0)}
                  placeholder="0.30"
                />
                <span className="text-sm text-muted-foreground">per word</span>
              </div>
            </div>

            {mode === 'client' && (
              <div className="space-y-2">
                <Label>Estimated Word Count</Label>
                <Input
                  type="number"
                  min="1"
                  value={estimatedWordCount}
                  onChange={e => setEstimatedWordCount(parseInt(e.target.value) || 0)}
                  placeholder="50000"
                />
                <p className="text-xs text-muted-foreground">
                  ≈ {estimatePageCountFromWords(estimatedWordCount)} pages (250-300 words/page)
                </p>
              </div>
            )}
          </div>
        )}

        {/* Per Page Pricing */}
        {pricingModel === 'per_page' && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>
                {mode === 'writer' ? 'Your Rate Per Page' : 'Rate Per Page'}
                <Badge variant="outline" className="ml-2">
                  Industry: ${recommendedRates.min.toFixed(0)}-${recommendedRates.max.toFixed(0)}
                </Badge>
              </Label>
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <Input
                  type="number"
                  min="1"
                  max="1000"
                  value={ratePerPage}
                  onChange={e => setRatePerPage(parseFloat(e.target.value) || 0)}
                  placeholder="125"
                />
                <span className="text-sm text-muted-foreground">per page</span>
              </div>
            </div>

            {mode === 'client' && (
              <div className="space-y-2">
                <Label>Estimated Page Count</Label>
                <Input
                  type="number"
                  min="1"
                  value={estimatedPageCount}
                  onChange={e => setEstimatedPageCount(parseInt(e.target.value) || 0)}
                  placeholder="200"
                />
                <p className="text-xs text-muted-foreground">
                  ≈ {estimateWordCountFromPages(estimatedPageCount).toLocaleString()} words
                </p>
              </div>
            )}
          </div>
        )}

        {/* Hourly Pricing */}
        {pricingModel === 'hourly' && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>
                {mode === 'writer' ? 'Your Hourly Rate' : 'Hourly Rate'}
                <Badge variant="outline" className="ml-2">
                  Industry: ${recommendedRates.min.toFixed(0)}-${recommendedRates.max.toFixed(0)}
                </Badge>
              </Label>
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <Input
                  type="number"
                  min="1"
                  max="500"
                  value={rateHourly}
                  onChange={e => setRateHourly(parseFloat(e.target.value) || 0)}
                  placeholder="65"
                />
                <span className="text-sm text-muted-foreground">per hour</span>
              </div>
            </div>

            {mode === 'client' && (
              <div className="space-y-2">
                <Label>Estimated Hours</Label>
                <Input
                  type="number"
                  min="1"
                  value={estimatedHours}
                  onChange={e => setEstimatedHours(parseFloat(e.target.value) || 0)}
                  placeholder="100"
                />
              </div>
            )}
          </div>
        )}

        {/* Per Project Pricing */}
        {pricingModel === 'per_project' && (
          <div className="space-y-4">
            {mode === 'writer' ? (
              <>
                <div className="space-y-2">
                  <Label>
                    Minimum Project Rate
                    <Badge variant="outline" className="ml-2">
                      Industry: ${recommendedRates.min.toLocaleString()}
                    </Badge>
                  </Label>
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <Input
                      type="number"
                      min="1"
                      value={projectRateMin}
                      onChange={e => setProjectRateMin(parseFloat(e.target.value) || 0)}
                      placeholder="15000"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>
                    Maximum Project Rate
                    <Badge variant="outline" className="ml-2">
                      Industry: ${recommendedRates.max.toLocaleString()}
                    </Badge>
                  </Label>
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <Input
                      type="number"
                      min="1"
                      value={projectRateMax}
                      onChange={e => setProjectRateMax(parseFloat(e.target.value) || 0)}
                      placeholder="30000"
                    />
                  </div>
                </div>
              </>
            ) : (
              <div className="space-y-2">
                <Label>Project Budget</Label>
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <Input
                    type="number"
                    min="1"
                    value={budget}
                    onChange={e => setBudget(parseFloat(e.target.value) || 0)}
                    placeholder="25000"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Typical range: ${recommendedRates.min.toLocaleString()}-$
                  {recommendedRates.max.toLocaleString()}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Estimated Cost (Client only) */}
        {mode === 'client' && (
          <div className="rounded-lg border bg-muted/50 p-4">
            <div className="flex items-start gap-3">
              <TrendingUp className="h-5 w-5 text-primary mt-0.5" />
              <div className="flex-1">
                <h4 className="font-semibold mb-1">Estimated Project Cost</h4>
                <p className="text-2xl font-bold">{estimatedCost.display}</p>
                <p className="text-xs text-muted-foreground mt-2">
                  <Info className="h-3 w-3 inline mr-1" />
                  Based on {getPricingModelDisplayName(pricingModel).toLowerCase()} pricing
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Industry Guidelines */}
        <div className="rounded-lg border bg-blue-50 dark:bg-blue-950 p-4">
          <p className="text-sm text-blue-900 dark:text-blue-100">
            <Info className="h-4 w-4 inline mr-2" />
            <strong>Industry Standard:</strong> {recommendedRates.description}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
