import { useRouter, useSearchParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { LoginParams, LoginSuccess } from "./api";
import { getLogin, getUserInfo, getLogout, getUserList } from "./api";
import useInfoStore from "@/stores/useUserInfo";
import Cookies from "js-cookie";

export function useLogin() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const searchParams = useSearchParams();
  const setInfo = useInfoStore((s) => s.setInfo);
  return useMutation<LoginSuccess, Error, LoginParams>({
    mutationFn: (params) => getLogin(params),

    onSuccess: async (data) => {
      console.log("login success:", data);
      Cookies.set("token", data.token);
      try {
        // const userInfo = await queryClient.fetchQuery({
        //   queryKey: ["userInfo"],
        //   queryFn: getUserInfo,
        // });
        setInfo({
          username: data.user.employeeId,
          nickname: data.user.name,
          permissions: data.user.permissions,
          // deptName: userInfo.deptName, // API response doesn't have deptName currently, might need to fetch if needed
        });
        // 3. 拿到用户信息后再跳转
        const redirect = searchParams.get("redirect");
        router.push(redirect ? decodeURIComponent(redirect) : "/");
      } catch (e) {
        console.error("获取用户信息失败:", e);
        // message.error("登录成功，但获取用户信息失败");
      }
    },

    onError: (error) => {
      console.error("login failed:", error);
    },
  });
}

export function useLogout() {
  const router = useRouter();
  const setInfo = useInfoStore((s) => s.setInfo);
  return useMutation({
    mutationFn: getLogout,

    onSuccess: () => {
      console.log("logout success");
      Cookies.remove("token");
      // Permission-Token 是 HttpOnly cookie，由服务端 /api/auth/logout 清除
      setInfo({
        username: "",
        nickname: "",
        deptName: "",
        permissions: []
      });
      router.push("/login");
    },

    onError: (error) => {
      console.error("logout failed:", error);
      // 即使请求失败（比如 token 过期），也可以选择清空状态并跳转
      Cookies.remove("token");
      setInfo({
        username: "",
        nickname: "",
        deptName: "",
        permissions: []
      });
      router.push("/login");
    },
  });
}

export function useUserInfo() {
  return useQuery({
    queryKey: ["userInfo"],
    queryFn: getUserInfo,
    enabled: false,
  });
}

export function useUserList(params?: { page?: number; pageSize?: number }) {
  return useQuery({
    queryKey: ["userList", params],
    queryFn: () => getUserList(params || { page: 1, pageSize: 1000 }),
  });
}