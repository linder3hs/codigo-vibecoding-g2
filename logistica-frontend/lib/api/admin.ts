import axiosInstance from "@/lib/axios";
import type { PaginatedResponse } from "@/types/common";
import type {
  AdminUser,
  AdminUserCreate,
  AdminGroup,
  AdminGroupCreate,
  AdminUserParams,
  Permission,
  PermissionParams,
} from "@/types/admin";

async function listUsers(
  params?: AdminUserParams,
): Promise<PaginatedResponse<AdminUser>> {
  const response = await axiosInstance.get<PaginatedResponse<AdminUser>>(
    "admin/users/",
    { params },
  );
  return response.data;
}

async function getUser(id: number): Promise<AdminUser> {
  const response = await axiosInstance.get<AdminUser>(`admin/users/${id}/`);
  return response.data;
}

async function createUser(data: AdminUserCreate): Promise<AdminUser> {
  const response = await axiosInstance.post<AdminUser>("admin/users/", data);
  return response.data;
}

async function updateUser(
  id: number,
  data: Partial<AdminUserCreate>,
): Promise<AdminUser> {
  const response = await axiosInstance.patch<AdminUser>(
    `admin/users/${id}/`,
    data,
  );
  return response.data;
}

async function removeUser(id: number): Promise<void> {
  await axiosInstance.delete(`admin/users/${id}/`);
}

async function assignGroups(
  userId: number,
  groupIds: number[],
): Promise<AdminUser> {
  const response = await axiosInstance.post<AdminUser>(
    `admin/users/${userId}/assign-groups/`,
    {
      group_ids: groupIds,
    },
  );
  return response.data;
}

async function listGroups(): Promise<PaginatedResponse<AdminGroup>> {
  const response = await axiosInstance.get<PaginatedResponse<AdminGroup>>(
    "admin/groups/?page_size=200",
  );
  return response.data;
}

async function getGroup(id: number): Promise<AdminGroup> {
  const response = await axiosInstance.get<AdminGroup>(`admin/groups/${id}/`);
  return response.data;
}

async function createGroup(data: AdminGroupCreate): Promise<AdminGroup> {
  const response = await axiosInstance.post<AdminGroup>("admin/groups/", data);
  return response.data;
}

async function updateGroup(
  id: number,
  data: AdminGroupCreate,
): Promise<AdminGroup> {
  const response = await axiosInstance.put<AdminGroup>(
    `admin/groups/${id}/`,
    data,
  );
  return response.data;
}

async function removeGroup(id: number): Promise<void> {
  await axiosInstance.delete(`admin/groups/${id}/`);
}

async function assignPermissions(
  groupId: number,
  permissionIds: number[],
): Promise<AdminGroup> {
  const response = await axiosInstance.post<AdminGroup>(
    `admin/groups/${groupId}/assign-permissions/`,
    {
      permission_ids: permissionIds,
    },
  );
  return response.data;
}

async function listPermissions(
  params?: PermissionParams,
): Promise<PaginatedResponse<Permission>> {
  const response = await axiosInstance.get<PaginatedResponse<Permission>>(
    "admin/permissions/",
    {
      params: { ...params, page_size: 300 },
    },
  );
  return response.data;
}

export const adminApi = {
  users: {
    list: listUsers,
    get: getUser,
    create: createUser,
    update: updateUser,
    remove: removeUser,
    assignGroups,
  },
  groups: {
    list: listGroups,
    get: getGroup,
    create: createGroup,
    update: updateGroup,
    remove: removeGroup,
    assignPermissions,
  },
  permissions: { list: listPermissions },
};
