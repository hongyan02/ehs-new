export interface DutyChangeApplication {
    id: number;
    from_name: string;
    from_no: string;
    from_position: string;
    from_date: string;
    from_shift: number;
    to_name: string;
    to_no: string;
    to_position: string;
    to_date: string;
    to_shift: number;
    status: DutyChangeStatus;
    reason?: string;
    created_at: string;
    updated_at: string;
}

export enum DutyChangeStatus {
    PENDING = 0,
    APPROVED = 1,
    REJECTED = 2,
    CANCELLED = 3,
}

export interface CreateDutyChangeParams {
    from_name: string;
    from_no: string;
    from_position: string;
    from_date: string;
    from_shift: number;
    to_name: string;
    to_no: string;
    to_position: string;
    to_date: string;
    to_shift: number;
    reason?: string;
}

export interface GetMyDutyChangeParams {
    user_no: string;
    status?: number;
}

export interface GetAllDutyChangeParams {
    status?: number;
}

export interface SwapDutyScheduleParams {
    from_no: string;
    from_date: string;
    to_no: string;
    to_date: string;
    shift: number;
}
