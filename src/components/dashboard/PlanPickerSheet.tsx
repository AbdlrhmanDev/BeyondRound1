'use client';

import { useTranslation } from 'react-i18next';
import { Check } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';

export type PlanId = 'one_time' | 'monthly' | 'three_month' | 'six_month';

export interface SelectedPlan {
  id: PlanId;
  name: string;
  price: string;        // display price e.g. "€14.99"
  priceNote: string;    // e.g. "/month" or ""
  total?: string;       // e.g. "€44.97 total"
}

interface Props {
  open: boolean;
  dayLabel: string;
  onSelectPlan: (plan: SelectedPlan) => void;
  onClose: () => void;
}

interface PlanCardProps {
  plan: SelectedPlan;
  badge?: string;
  save?: string;
  desc: string;
  highlight?: boolean;
  onSelect: (plan: SelectedPlan) => void;
}

function PlanCard({ plan, badge, save, desc, highlight, onSelect }: PlanCardProps) {
  return (
    <button
      type="button"
      onClick={() => onSelect(plan)}
      className="w-full text-left rounded-[18px] p-4 transition-all active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F6B4A8] focus-visible:ring-offset-2"
      style={{
        background: highlight ? 'rgba(242,124,92,0.05)' : '#FFFFFF',
        border: highlight
          ? '1.5px solid rgba(242,124,92,0.50)'
          : '1px solid rgba(58,11,34,0.09)',
        boxShadow: highlight
          ? '0 4px 16px rgba(242,124,92,0.10)'
          : '0 2px 8px rgba(26,10,18,0.05)',
      }}
    >
      <div className="flex items-start justify-between gap-3">
        {/* Left — name + desc */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-0.5">
            <span
              className="text-[13px] font-semibold leading-tight"
              style={{ color: '#1A0A12' }}
            >
              {plan.name}
            </span>
            {badge && (
              <span
                className="text-[10px] font-bold tracking-[0.08em] uppercase px-2 py-0.5 rounded-full"
                style={{
                  background: highlight ? 'rgba(242,124,92,0.15)' : 'rgba(58,11,34,0.07)',
                  color: highlight ? '#F27C5C' : '#3A0B22',
                }}
              >
                {badge}
              </span>
            )}
          </div>
          <p className="text-[12px] leading-snug" style={{ color: '#9B8F8B' }}>
            {desc}
          </p>
          {(plan.total || save) && (
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              {plan.total && (
                <span className="text-[11px]" style={{ color: '#9B8F8B' }}>
                  {plan.total}
                </span>
              )}
              {save && (
                <span
                  className="text-[11px] font-semibold px-1.5 py-0.5 rounded-full"
                  style={{ background: 'rgba(242,124,92,0.10)', color: '#F27C5C' }}
                >
                  {save}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Right — price + select */}
        <div className="flex flex-col items-end gap-2 shrink-0">
          <div className="flex items-end gap-0.5 leading-none">
            <span
              className="font-display font-bold"
              style={{ fontSize: '1.35rem', color: '#1A0A12' }}
            >
              {plan.price}
            </span>
            {plan.priceNote && (
              <span className="text-[11px] mb-[2px]" style={{ color: '#9B8F8B' }}>
                {plan.priceNote}
              </span>
            )}
          </div>
          <div
            className="flex items-center justify-center w-6 h-6 rounded-full"
            style={{
              background: highlight ? '#F27C5C' : 'rgba(58,11,34,0.07)',
            }}
            aria-hidden="true"
          >
            <Check
              className="h-3.5 w-3.5"
              style={{ color: highlight ? '#FFFFFF' : '#3A0B22' }}
            />
          </div>
        </div>
      </div>
    </button>
  );
}

export default function PlanPickerSheet({ open, dayLabel, onSelectPlan, onClose }: Props) {
  const { t } = useTranslation('common');

  const plans: Array<{
    plan: SelectedPlan;
    badge?: string;
    save?: string;
    desc: string;
    highlight?: boolean;
  }> = [
    {
      plan: {
        id: 'one_time',
        name: t('oneTimeTrial'),
        price: t('trialPrice'),
        priceNote: '',
      },
      desc: t('trialDesc'),
    },
    {
      plan: {
        id: 'monthly',
        name: t('monthly'),
        price: t('monthlyPrice'),
        priceNote: t('perMonth'),
      },
      desc: t('monthlyDesc'),
    },
    {
      plan: {
        id: 'three_month',
        name: t('threeMonth'),
        price: t('threeMonthPrice'),
        priceNote: t('perMonth'),
        total: t('threeMonthTotal'),
      },
      badge: t('threeMonthBadge'),
      save: t('threeMonthSave'),
      desc: t('threeMonthDesc'),
      highlight: true,
    },
    {
      plan: {
        id: 'six_month',
        name: t('sixMonth'),
        price: t('sixMonthPrice'),
        priceNote: t('perMonth'),
        total: t('sixMonthTotal'),
      },
      badge: t('sixMonthBadge'),
      save: t('sixMonthSave'),
      desc: t('sixMonthDesc'),
    },
  ];

  return (
    <Sheet open={open} onOpenChange={(isOpen) => { if (!isOpen) onClose(); }}>
      <SheetContent
        side="bottom"
        className="rounded-t-[28px] max-h-[92vh] flex flex-col p-0 gap-0"
        style={{ background: '#F7F2EE' }}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1 shrink-0">
          <div
            className="h-1 w-10 rounded-full"
            style={{ background: 'rgba(58,11,34,0.15)' }}
          />
        </div>

        {/* Header */}
        <div
          className="px-6 pt-3 pb-4 shrink-0"
          style={{ borderBottom: '1px solid rgba(58,11,34,0.07)' }}
        >
          <SheetHeader className="text-left space-y-0.5">
            <SheetTitle
              className="font-heading text-xl font-bold"
              style={{ color: '#1A0A12' }}
            >
              {t('simpleTransparent')}
            </SheetTitle>
            <p className="text-[13px]" style={{ color: '#9B8F8B' }}>
              {dayLabel}
            </p>
          </SheetHeader>
        </div>

        {/* Plan list */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
          {plans.map(({ plan, badge, save, desc, highlight }) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              badge={badge}
              save={save}
              desc={desc}
              highlight={highlight}
              onSelect={onSelectPlan}
            />
          ))}
        </div>

        {/* Footer microcopy */}
        <div
          className="px-6 py-4 shrink-0 text-center"
          style={{ borderTop: '1px solid rgba(58,11,34,0.07)' }}
        >
          <p className="text-[11px]" style={{ color: '#9B8F8B' }}>
            {t('guaranteeTitle')} · {t('guaranteeNote')}
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
}
