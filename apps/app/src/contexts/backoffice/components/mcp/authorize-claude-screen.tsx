import { useMutation, useQuery } from "@tanstack/react-query";
import { Check } from "lucide-react";
import { useCallback, useState, type ReactNode } from "react";
import type { McpAccessLevel, McpAuthorizationResponse } from "@passalio/shared";
import { Button, buttonVariants } from "@/components/ui/button";
import { AuthLayout } from "@/contexts/identity";
import { apiErrorOf, unwrap, type ApiError } from "@/lib/api-client";
import { errorCodeLine } from "@/lib/errors";
import { formatLongDate } from "@/lib/format-date";
import { shortTraceId } from "@/lib/api-client";
import { ADMIN_PATH } from "@/lib/session";
import { mcpApi } from "../../mcp-api";
import { MCP_ACCESS_LABELS, mcpFr } from "../../mcp-fr";
import { AccessChoice } from "./access-choice";
import { AuthorizeSkeleton } from "./authorize-skeleton";

const SHOWCASE = { badge: mcpFr.showcaseBadge, title: mcpFr.showcaseTitle };

const INVALID_CODES: ReadonlySet<string> = new Set([
  "authorization_invalid",
  "authorization_expired",
  "redirect_not_allowed",
  "pkce_required",
  "forbidden",
]);

const DEFAULT_ACCESS: McpAccessLevel = "write";

const LINK_CLASS =
  "flex min-h-12 items-center text-[15px] text-[#475569] hover:text-[#0F2A44] lg:min-h-0 lg:text-[13px]";

const Heading = ({ title, children }: { readonly title: string; readonly children: ReactNode }) => (
  <div className="flex flex-col gap-1.5">
    <h1 className="text-[22px] leading-tight font-bold tracking-[-0.015em]">{title}</h1>
    <p className="text-base leading-normal text-[#475569] lg:text-sm">{children}</p>
  </div>
);

const Layout = ({ children }: { readonly children: ReactNode }) => (
  <AuthLayout showcase={SHOWCASE} hasMobileBand={false}>
    <div className="flex flex-col gap-5">{children}</div>
  </AuthLayout>
);

const isInvalid = (error: ApiError) => INVALID_CODES.has(error.code);

const InvalidRequest = () => (
  <Layout>
    <Heading title={mcpFr.invalidTitle}>{mcpFr.invalidText}</Heading>
    <a href={ADMIN_PATH} className={buttonVariants()}>
      {mcpFr.toAdmin}
    </a>
  </Layout>
);

const LoadError = ({
  error,
  onRetry,
}: {
  readonly error: ApiError;
  readonly onRetry: () => void;
}) => {
  const code = shortTraceId(error.traceId);
  return (
    <Layout>
      <Heading title={mcpFr.errorTitle}>
        {mcpFr.errorText}
        {code === null ? null : mcpFr.errorCode(code)}
      </Heading>
      <Button onClick={onRetry}>{mcpFr.retry}</Button>
    </Layout>
  );
};

const Granted = ({
  redirectTo,
  access,
  expiresAt,
}: {
  readonly redirectTo: string;
  readonly access: McpAccessLevel;
  readonly expiresAt: string;
}) => (
  <Layout>
    <span className="flex size-12 items-center justify-center rounded-full bg-[#E7F5EF] lg:size-11">
      <Check
        aria-hidden="true"
        className="size-6 text-[#0E7C5A] lg:size-[22px]"
        strokeWidth={2.2}
      />
    </span>
    <Heading title={mcpFr.grantedTitle}>
      {mcpFr.grantedText(MCP_ACCESS_LABELS[access], formatLongDate(new Date(expiresAt)))}
    </Heading>
    <a href={redirectTo} className={buttonVariants()}>
      {mcpFr.backToClaude}
    </a>
    <a href={ADMIN_PATH} className={LINK_CLASS}>
      {mcpFr.toAdmin}
    </a>
  </Layout>
);

type ConsentFormProps = {
  readonly request: McpAuthorizationResponse;
  readonly email: string;
  readonly onGranted: (redirectTo: string, access: McpAccessLevel, expiresAt: string) => void;
  readonly onInvalid: () => void;
};

const ConsentForm = ({ request, email, onGranted, onInvalid }: ConsentFormProps) => {
  const [access, setAccess] = useState<McpAccessLevel>(DEFAULT_ACCESS);
  const approve = useMutation({
    mutationFn: async () => unwrap(await mcpApi.approve(request.handle, access)),
    onSuccess: ({ redirectTo, expiresAt }) => onGranted(redirectTo, access, expiresAt),
    onError: (error) => {
      if (isInvalid(apiErrorOf(error))) {
        onInvalid();
      }
    },
  });
  const deny = useMutation({
    mutationFn: async () => unwrap(await mcpApi.deny(request.handle)),
    onSuccess: ({ redirectTo }) => window.location.assign(redirectTo),
    onError: (error) => {
      if (isInvalid(apiErrorOf(error))) {
        onInvalid();
      }
    },
  });
  const { mutate: approveRequest } = approve;
  const { mutate: denyRequest } = deny;
  const submit = useCallback(() => approveRequest(), [approveRequest]);
  const refuse = useCallback(() => denyRequest(), [denyRequest]);
  const isBusy = approve.isPending || deny.isPending;
  const failure = approve.error ?? deny.error;
  const failureLine = failure === null ? undefined : errorCodeLine(apiErrorOf(failure));
  return (
    <Layout>
      <Heading title={mcpFr.title}>{mcpFr.text(email)}</Heading>
      <div className="flex flex-col gap-0.5 rounded-[10px] border border-[#E3E8EF] bg-[#F7F9FB] px-3.5 py-3 lg:gap-1">
        <span className="text-sm text-[#64748B] lg:text-[13px]">{mcpFr.requestedBy}</span>
        <strong className="text-base lg:text-sm">{request.clientName}</strong>
        <span className="text-sm text-[#475569]">{mcpFr.returnTo(request.redirectHost)}</span>
        {request.isLoopback ? (
          <span className="pt-1 text-sm text-[#9A3412]">{mcpFr.loopbackWarning}</span>
        ) : null}
      </div>
      <AccessChoice value={access} onChange={setAccess} />
      <p className="text-sm leading-normal text-[#475569] lg:text-[13px]">{mcpFr.footnote}</p>
      <div className="flex flex-col-reverse gap-2.5 lg:flex-row lg:gap-3">
        <Button variant="secondary" className="flex-1" disabled={isBusy} onClick={refuse}>
          {mcpFr.deny}
        </Button>
        <Button className="flex-1" disabled={isBusy} onClick={submit}>
          {approve.isPending ? mcpFr.approving : mcpFr.approve}
        </Button>
      </div>
      {failure === null || isInvalid(apiErrorOf(failure)) ? null : (
        <p
          role="alert"
          className="rounded-[10px] border border-[#F5C2C0] bg-[#FDF2F2] px-3.5 py-3 text-sm leading-normal text-[#9B1C1C]"
        >
          {mcpFr.errorTitle}. {failureLine}
        </p>
      )}
    </Layout>
  );
};

type Granting = {
  readonly redirectTo: string;
  readonly access: McpAccessLevel;
  readonly expiresAt: string;
};

type AuthorizeClaudeScreenProps = {
  readonly query: string;
  readonly email: string;
};

const NO_RETRY = false;

export const AuthorizeClaudeScreen = ({ query, email }: AuthorizeClaudeScreenProps) => {
  const [granting, setGranting] = useState<Granting | null>(null);
  const [isExpired, setIsExpired] = useState(false);
  const request = useQuery({
    queryKey: ["mcp-authorization", query],
    queryFn: async () => unwrap(await mcpApi.fetchAuthorization(query)),
    retry: NO_RETRY,
    staleTime: Number.POSITIVE_INFINITY,
    refetchOnWindowFocus: false,
  });
  const { refetch } = request;
  const retry = useCallback(() => void refetch(), [refetch]);
  const grant = useCallback((redirectTo: string, access: McpAccessLevel, expiresAt: string) => {
    setGranting({ redirectTo, access, expiresAt });
    window.location.assign(redirectTo);
  }, []);
  const expire = useCallback(() => setIsExpired(true), []);

  if (granting !== null) {
    return <Granted {...granting} />;
  }
  if (isExpired) {
    return <InvalidRequest />;
  }
  if (request.isPending) {
    return (
      <Layout>
        <AuthorizeSkeleton />
      </Layout>
    );
  }
  if (request.isError) {
    const error = apiErrorOf(request.error);
    return isInvalid(error) ? <InvalidRequest /> : <LoadError error={error} onRetry={retry} />;
  }
  return <ConsentForm request={request.data} email={email} onGranted={grant} onInvalid={expire} />;
};
