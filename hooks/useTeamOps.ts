import { ApprovalRequest, TeamSpace } from '../types';
import { APPROVAL_REQUESTS_STORAGE_KEY, TEAM_SPACES_STORAGE_KEY } from '../services/storage';
import { useBackendState } from './useBackendState';

export const useTeamOps = () => {
  const [teamSpaces, setTeamSpaces, teamMeta] = useBackendState<TeamSpace[]>(
    TEAM_SPACES_STORAGE_KEY,
    'teamSpaces',
    []
  );
  const [approvalRequests, setApprovalRequests, approvalMeta] = useBackendState<ApprovalRequest[]>(
    APPROVAL_REQUESTS_STORAGE_KEY,
    'approvalRequests',
    []
  );

  const saveTeamSpace = (team: TeamSpace) => {
    setTeamSpaces(previous => [team, ...previous.filter(item => item.id !== team.id)]);
  };

  const saveApprovalRequest = (request: ApprovalRequest) => {
    setApprovalRequests(previous => [request, ...previous.filter(item => item.id !== request.id)]);
  };

  const updateApprovalRequest = (id: string, status: ApprovalRequest['status'], reviewedBy = 'local-reviewer') => {
    setApprovalRequests(previous => previous.map(request => request.id === id
      ? { ...request, status, reviewedBy, reviewedAt: Date.now() }
      : request
    ));
  };

  return {
    teamSpaces,
    setTeamSpaces,
    saveTeamSpace,
    approvalRequests,
    setApprovalRequests,
    saveApprovalRequest,
    updateApprovalRequest,
    backendReady: teamMeta.backendReady && approvalMeta.backendReady,
    backendError: teamMeta.backendError || approvalMeta.backendError
  };
};
