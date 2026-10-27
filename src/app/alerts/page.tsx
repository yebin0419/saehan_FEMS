export default function AlertsPage() {
  return (
    <section className="space-y-4">
      <h2 className="text-xl font-semibold">알림 설정 / 이력</h2>
      <p className="text-sm text-slate-500">
        이메일 수신자(ems_alert_channel), 규칙(ems_alert_rule), 발송 이력
        (ems_alert_log) UI는 Phase 4에서 Vercel Cron / Resend 연동과 함께
        작성됩니다.
      </p>
    </section>
  );
}
