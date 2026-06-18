import { useState } from "react";
import { useLocation } from "wouter";
import { useCreateCompetitionReview, useGetCompetitionReviews } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Layout, PageHeader } from "@/components/layout";
import { Scorecard, ImplIntentionTrio } from "@/components/ui-elements";
import { PHASE_COLORS } from "@/lib/constants";
import { Plus, ArrowRight } from "lucide-react";

export default function CompetitionReview() {
  const phaseColor = PHASE_COLORS[0]; // fallback
  const queryClient = useQueryClient();
  const { data: reviews, isLoading } = useGetCompetitionReviews();
  const createMutation = useCreateCompetitionReview();
  const [, setLocation] = useLocation();

  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    competitionName: "",
    competitionDate: new Date().toISOString().split('T')[0],
    opponent: "",
    result: "",
    performanceRating: 0,
    decisionRating: 0,
    emotionRating: 0,
    bestDecision: "",
    changeDecision: "",
    keyLearning: "",
    implWhen: "",
    implWhere: "",
    implHow: ""
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({ data: formData }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/athlete/competition-reviews"] });
        setIsCreating(false);
        setFormData({
          competitionName: "",
          competitionDate: new Date().toISOString().split('T')[0],
          opponent: "",
          result: "",
          performanceRating: 0,
          decisionRating: 0,
          emotionRating: 0,
          bestDecision: "",
          changeDecision: "",
          keyLearning: "",
          implWhen: "",
          implWhere: "",
          implHow: ""
        });
      }
    });
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-full min-h-[50vh]">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
        </div>
      </Layout>
    );
  }

  if (isCreating) {
    return (
      <Layout>
        <PageHeader title="New Review" subtitle="Competition" phaseColor={phaseColor} />
        <form onSubmit={handleSubmit} className="p-6 space-y-8">
          <div className="space-y-4">
            <div>
              <label className="block font-mono text-xs text-muted-foreground mb-1">COMPETITION NAME</label>
              <input 
                required type="text" 
                value={formData.competitionName} onChange={e => setFormData({...formData, competitionName: e.target.value})}
                className="w-full bg-background border rounded-md px-3 py-2"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block font-mono text-xs text-muted-foreground mb-1">DATE</label>
                <input 
                  required type="date" 
                  value={formData.competitionDate} onChange={e => setFormData({...formData, competitionDate: e.target.value})}
                  className="w-full bg-background border rounded-md px-3 py-2"
                />
              </div>
              <div>
                <label className="block font-mono text-xs text-muted-foreground mb-1">RESULT</label>
                <input 
                  type="text" 
                  value={formData.result} onChange={e => setFormData({...formData, result: e.target.value})}
                  className="w-full bg-background border rounded-md px-3 py-2"
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-heading text-xl uppercase">Ratings</h3>
            <Scorecard label="Performance" value={formData.performanceRating} onChange={v => setFormData({...formData, performanceRating: v})} />
            <Scorecard label="Decision Making" value={formData.decisionRating} onChange={v => setFormData({...formData, decisionRating: v})} />
            <Scorecard label="Emotional Control" value={formData.emotionRating} onChange={v => setFormData({...formData, emotionRating: v})} />
          </div>

          <div className="space-y-4">
            <h3 className="font-heading text-xl uppercase">Analysis</h3>
            <div>
              <label className="block font-mono text-xs text-muted-foreground mb-1">BEST DECISION MADE</label>
              <textarea 
                value={formData.bestDecision} onChange={e => setFormData({...formData, bestDecision: e.target.value})}
                className="w-full bg-muted/30 border rounded-md px-3 py-2 min-h-[80px]"
              />
            </div>
            <div>
              <label className="block font-mono text-xs text-muted-foreground mb-1">DECISION TO CHANGE</label>
              <textarea 
                value={formData.changeDecision} onChange={e => setFormData({...formData, changeDecision: e.target.value})}
                className="w-full bg-muted/30 border rounded-md px-3 py-2 min-h-[80px]"
              />
            </div>
          </div>

          <ImplIntentionTrio 
            when={formData.implWhen} onWhenChange={v => setFormData({...formData, implWhen: v})}
            where={formData.implWhere} onWhereChange={v => setFormData({...formData, implWhere: v})}
            how={formData.implHow} onHowChange={v => setFormData({...formData, implHow: v})}
          />

          <div className="flex gap-4">
            <button type="button" onClick={() => setIsCreating(false)} className="flex-1 py-3 border rounded-md font-heading uppercase text-lg">Cancel</button>
            <button type="submit" disabled={createMutation.isPending} className="flex-1 py-3 bg-primary text-primary-foreground rounded-md font-heading uppercase text-lg">
              {createMutation.isPending ? "Saving..." : "Save Review"}
            </button>
          </div>
        </form>
      </Layout>
    );
  }

  return (
    <Layout>
      <PageHeader title="Competition Reviews" />
      <div className="p-6 space-y-6">
        <button 
          onClick={() => setIsCreating(true)}
          className="w-full py-4 border-2 border-dashed border-muted-foreground/30 rounded-xl flex items-center justify-center gap-2 text-muted-foreground hover:bg-muted/30 transition-colors"
        >
          <Plus size={20} /> <span className="font-heading text-xl uppercase tracking-wide">Log New Review</span>
        </button>

        <div className="space-y-4">
          {reviews?.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No competition reviews logged yet.</p>
          ) : (
            reviews?.map(review => (
              <div key={review.id} className="bg-card border p-4 rounded-xl">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-heading text-xl uppercase">{review.competitionName || "Unnamed Competition"}</h3>
                    <p className="font-mono text-xs text-muted-foreground">{new Date(review.competitionDate || "").toLocaleDateString()}</p>
                  </div>
                  <div className="bg-muted px-2 py-1 rounded font-mono text-xs">{review.result}</div>
                </div>
                <div className="flex gap-4 mt-4 font-mono text-xs">
                  <div>PERF: {review.performanceRating}/5</div>
                  <div>DEC: {review.decisionRating}/5</div>
                  <div>EMO: {review.emotionRating}/5</div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </Layout>
  );
}
