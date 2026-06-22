import { useState } from 'react';
import { useLocation } from 'wouter';
import { useCreateCompetitionReview, useGetCompetitionReviews } from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { Layout } from '@/components/layout';
import { RatingRow, GuidedField, WriteField, ImplIntention, ModuleHeader } from '@/components/ui-elements';
import { PHASE_COLORS } from '@/lib/constants';

const PHASE_COLOUR = '#FF4936';

export default function CompetitionReview() {
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const { data: reviews, isLoading } = useGetCompetitionReviews();
  const createMutation = useCreateCompetitionReview();

  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    competitionName: '',
    competitionDate: new Date().toISOString().split('T')[0],
    opponent: '',
    result: '',
    performanceRating: 0,
    decisionRating: 0,
    emotionRating: 0,
    bestDecision: '',
    changeDecision: '',
    keyLearning: '',
    implWhen: '',
    implWhere: '',
    implHow: '',
  });

  function set(key: string, value: unknown) {
    setFormData(prev => ({ ...prev, [key]: value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    createMutation.mutate(
      { data: formData },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ['/api/athlete/competition-reviews'] });
          setIsCreating(false);
          setFormData({
            competitionName: '',
            competitionDate: new Date().toISOString().split('T')[0],
            opponent: '',
            result: '',
            performanceRating: 0,
            decisionRating: 0,
            emotionRating: 0,
            bestDecision: '',
            changeDecision: '',
            keyLearning: '',
            implWhen: '',
            implWhere: '',
            implHow: '',
          });
        },
      }
    );
  }

  if (isLoading) {
    return (
      <Layout currentPhase={3} currentSection="Competition Review">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
          <div style={{ width: 32, height: 32, border: `4px solid ${PHASE_COLOUR}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        </div>
      </Layout>
    );
  }

  if (isCreating) {
    return (
      <Layout currentPhase={3} currentSection="Competition Review">
        <div style={{ maxWidth: 720, margin: '0 auto', padding: '0 0 120px' }}>
          <div style={{ padding: '28px 24px 20px', borderBottom: '1px solid var(--grey1)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <ModuleHeader eyebrow="Phase 3" title="Competition Review" colour={PHASE_COLOUR} />
            <button
              type="button"
              onClick={() => setIsCreating(false)}
              style={{ fontFamily: 'var(--font-m)', fontSize: 10, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--grey)', background: 'none', border: 'none', cursor: 'pointer', paddingTop: 4 }}
            >
              ← Cancel
            </button>
          </div>

          <form onSubmit={handleSubmit} style={{ padding: '24px' }}>

            {/* Event details */}
            <div style={{ marginBottom: 28 }}>
              <div style={{ fontFamily: 'var(--font-m)', fontSize: 10, letterSpacing: '.16em', textTransform: 'uppercase', color: PHASE_COLOUR, fontWeight: 700, marginBottom: 12 }}>
                Event Details
              </div>
              <WriteField label="Competition name:" value={formData.competitionName} onChange={v => set('competitionName', v)} phaseColour={PHASE_COLOUR} />
              <WriteField label="Date:" value={formData.competitionDate} onChange={v => set('competitionDate', v)} phaseColour={PHASE_COLOUR} />
              <WriteField label="Opponent / draw:" value={formData.opponent} onChange={v => set('opponent', v)} phaseColour={PHASE_COLOUR} />
              <WriteField label="Result (W/L/score):" value={formData.result} onChange={v => set('result', v)} phaseColour={PHASE_COLOUR} />
            </div>

            {/* Performance ratings */}
            <div style={{ marginBottom: 28 }}>
              <div style={{ fontFamily: 'var(--font-m)', fontSize: 10, letterSpacing: '.16em', textTransform: 'uppercase', color: PHASE_COLOUR, fontWeight: 700, marginBottom: 12 }}>
                Performance Ratings
              </div>
              <RatingRow
                label="Overall performance quality"
                lo="Well below level"
                hi="Best performance"
                value={formData.performanceRating}
                onChange={v => set('performanceRating', v)}
                phaseColour={PHASE_COLOUR}
              />
              <RatingRow
                label="Decision making under pressure"
                lo="Poor decisions"
                hi="Excellent decisions"
                value={formData.decisionRating}
                onChange={v => set('decisionRating', v)}
                phaseColour={PHASE_COLOUR}
              />
              <RatingRow
                label="Emotional control and composure"
                lo="Lost control"
                hi="Full composure"
                value={formData.emotionRating}
                onChange={v => set('emotionRating', v)}
                phaseColour={PHASE_COLOUR}
              />
            </div>

            {/* Analysis */}
            <div style={{ marginBottom: 28 }}>
              <div style={{ fontFamily: 'var(--font-m)', fontSize: 10, letterSpacing: '.16em', textTransform: 'uppercase', color: PHASE_COLOUR, fontWeight: 700, marginBottom: 12 }}>
                Analysis
              </div>
              <GuidedField
                label="Best moment or best decision:"
                hint="One specific moment — describe what happened and why it worked."
                placeholder="e.g. 5-4 in the third, I attacked the short ball instead of playing safe. It worked because I'd practised that exact pattern."
                value={formData.bestDecision}
                onChange={v => set('bestDecision', v)}
                phaseColour={PHASE_COLOUR}
              />
              <GuidedField
                label="Decision I would change — and why:"
                hint="Not a mistake — a decision. What would you do differently and why?"
                placeholder="e.g. At 4-3 I went for a winner when I should have reset the point. I was trying to end it too early instead of trusting my pattern."
                value={formData.changeDecision}
                onChange={v => set('changeDecision', v)}
                phaseColour={PHASE_COLOUR}
              />
              <GuidedField
                label="One thing this competition taught me:"
                hint="What development insight came from this match?"
                placeholder="e.g. I handle pressure better when I have a game plan going in. When I don't have a plan I start reacting instead of competing."
                value={formData.keyLearning}
                onChange={v => set('keyLearning', v)}
                phaseColour={PHASE_COLOUR}
              />
            </div>

            {/* Implementation intention */}
            <ImplIntention
              label="Next competition I will:"
              values={{ when: formData.implWhen, where: formData.implWhere, how: formData.implHow }}
              onChange={(field, val) => set(`impl${field.charAt(0).toUpperCase() + field.slice(1)}`, val)}
              phaseColour={PHASE_COLOUR}
            />

            <div style={{ marginTop: 28 }}>
              <button
                type="submit"
                disabled={createMutation.isPending}
                style={{
                  width: '100%',
                  padding: '14px 0',
                  borderRadius: 6,
                  border: 'none',
                  background: PHASE_COLOUR,
                  color: '#fff',
                  fontFamily: 'var(--font-d)',
                  fontWeight: 800,
                  fontSize: 20,
                  textTransform: 'uppercase',
                  letterSpacing: '.04em',
                  cursor: createMutation.isPending ? 'wait' : 'pointer',
                  opacity: createMutation.isPending ? .7 : 1,
                }}
              >
                {createMutation.isPending ? 'Saving…' : 'Save Review'}
              </button>
            </div>
          </form>
        </div>
      </Layout>
    );
  }

  return (
    <Layout currentPhase={3} currentSection="Competition Reviews">
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '0 0 120px' }}>
        <div style={{ padding: '28px 24px 20px', borderBottom: '1px solid var(--grey1)' }}>
          <div style={{ fontFamily: 'var(--font-m)', fontSize: 10, letterSpacing: '.18em', textTransform: 'uppercase', color: PHASE_COLOUR, marginBottom: 5 }}>Phase 3</div>
          <div style={{ fontFamily: 'var(--font-d)', fontWeight: 800, fontSize: 36, textTransform: 'uppercase', letterSpacing: '-.01em', color: 'var(--black)', lineHeight: .95 }}>
            Competition Reviews
          </div>
        </div>

        <div style={{ padding: '24px' }}>
          <button
            onClick={() => setIsCreating(true)}
            style={{
              width: '100%',
              padding: '16px',
              border: `2px dashed ${PHASE_COLOUR}50`,
              borderRadius: 8,
              background: `${PHASE_COLOUR}08`,
              fontFamily: 'var(--font-d)',
              fontWeight: 800,
              fontSize: 18,
              textTransform: 'uppercase',
              letterSpacing: '.06em',
              color: PHASE_COLOUR,
              cursor: 'pointer',
              marginBottom: 24,
            }}
          >
            + Log New Review
          </button>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {!reviews?.length ? (
              <p style={{ textAlign: 'center', color: 'var(--grey)', padding: '32px 0', fontFamily: 'var(--font-m)', fontSize: 12, letterSpacing: '.08em' }}>
                No competition reviews logged yet.
              </p>
            ) : (
              reviews.map(review => (
                <div
                  key={review.id}
                  style={{
                    background: '#fff',
                    border: '1px solid var(--grey1)',
                    borderLeft: `4px solid ${PHASE_COLOUR}`,
                    borderRadius: '0 8px 8px 0',
                    padding: '16px 18px',
                    boxShadow: '0 1px 4px rgba(0,0,0,.04)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                    <div>
                      <div style={{ fontFamily: 'var(--font-d)', fontWeight: 800, fontSize: 20, textTransform: 'uppercase', color: 'var(--black)' }}>
                        {review.competitionName || 'Unnamed Competition'}
                      </div>
                      <div style={{ fontFamily: 'var(--font-m)', fontSize: 10, color: 'var(--grey)', letterSpacing: '.08em', marginTop: 2 }}>
                        {review.competitionDate ? new Date(review.competitionDate).toLocaleDateString() : ''}
                      </div>
                    </div>
                    {review.result && (
                      <span style={{ fontFamily: 'var(--font-m)', fontSize: 11, fontWeight: 700, color: PHASE_COLOUR, background: `${PHASE_COLOUR}15`, padding: '3px 10px', borderRadius: 100, letterSpacing: '.08em' }}>
                        {review.result}
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: 16, fontFamily: 'var(--font-m)', fontSize: 10, letterSpacing: '.08em', color: 'var(--grey)', textTransform: 'uppercase' }}>
                    <span>Perf: {review.performanceRating}/5</span>
                    <span>Decision: {review.decisionRating}/5</span>
                    <span>Emotion: {review.emotionRating}/5</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
