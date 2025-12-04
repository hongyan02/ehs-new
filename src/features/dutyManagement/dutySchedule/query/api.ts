import request from "@/utils/request";
import { API_SERVICE } from "@/config/api";

//获取值班表
export function getDutySchedule(params: any) {
  return request.get(API_SERVICE.dutySchedule.getDutySchedule, { params });
}

//获取所有值班人员
export function getAllDutyPersons() {
  return request.get(API_SERVICE.dutyPerson.dutyPerson, { params: { pageSize: 1000 } });
}

//创建值班记录
export function createDutySchedule(data: any) {
  return request.post(API_SERVICE.dutySchedule.dutySchedule, data);
}

//删除值班记录（按 ID）
export function deleteDutySchedule(id: number) {
  return request.delete(`${API_SERVICE.dutySchedule.dutySchedule}/${id}`);
}
