import request from "@/utils/request";
import { API_SERVICE } from "@/config/api";

export interface LoginParams {
  username: string;
  password: string;
}

export interface LoginResponse {
  msg: string;
  code: number;
  token: string;
  user: {
    name: string;
    employeeId: string;
    permissions: string[];
  };
}

export interface LoginSuccess {
  msg: string;
  token: string;
  user: {
    name: string;
    employeeId: string;
    permissions: string[];
  };
}
// 后端原始响应结构
export interface RawUserInfoResponse {
  msg: string;
  code: number;
  permissions: string[];
  roles: string[];
  user: {
    userId: number;
    deptId: number;
    userName: string;
    nickName: string;
    email: string;
    phonenumber: string;
    sex: string;
    avatar: string;
    status: string;
    loginIp: string;
    loginDate: string;
    dept?: {
      deptId: number;
      deptName: string;
      // 其他字段不关心就不写
    };
    // roles 里还有一层对象数组，这里你如果不用就可以不写
  };
}

export interface UserInfo {
  userId: number;
  userName: string;
  nickName: string;
  deptId: number;
  deptName?: string;
}
//登陆
export async function getLogin(params: LoginParams) {
  const res = await request.post<LoginResponse>(
    API_SERVICE.login.login,
    params,
    {
      headers: { isToken: false },
    },
  );
  const data = res.data;

  // ✅ 这里根据业务code判断是否成功
  if (data.code !== 200 || !data.token) {
    throw new Error(data.msg || "登录失败");
  }

  return {
    msg: data.msg,
    token: data.token,
    user: (data as any).user, // Type assertion needed if LoginResponse doesn't have user yet, or update LoginResponse
  };
}

//登出
export function getLogout() {
  return request.post<LoginResponse>(API_SERVICE.login.logout);
}

//获取用户信息
export async function getUserInfo(): Promise<UserInfo> {
  const res = await request.get<RawUserInfoResponse>(
    API_SERVICE.userInfo.getInfo,
  );
  const data = res.data;
  const user = data.user;

  //只返回前端真正需要的字段
  const info: UserInfo = {
    userId: user.userId,
    userName: user.userName,
    nickName: user.nickName,
    deptId: user.deptId,
    deptName: user.dept?.deptName,
  };

  return info;
}


export interface GetListParams {
  page?: number;
  pageSize?: number;
}
export async function getUserList(params: GetListParams) {
  const res = await request.get<RawUserInfoResponse[]>(API_SERVICE.userInfo.list, { params })
  return res;
}