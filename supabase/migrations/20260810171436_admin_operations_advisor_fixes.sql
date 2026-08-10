CREATE INDEX IF NOT EXISTS idx_admin_audit_log_actor_id ON public.admin_audit_log (actor_id);
CREATE INDEX IF NOT EXISTS idx_compliance_documents_uploaded_by ON public.compliance_documents (uploaded_by);

CREATE POLICY compliance_documents_service_role_all
  ON public.compliance_documents FOR ALL TO service_role
  USING (TRUE) WITH CHECK (TRUE);

CREATE POLICY admin_audit_log_service_role_all
  ON public.admin_audit_log FOR ALL TO service_role
  USING (TRUE) WITH CHECK (TRUE);
