/**
 * Copyright 2025 RAIDS Lab
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import instance, { VERSION } from '@/services/axios'
import { IResponse } from '@/services/types'
import {
  ListImageResponse,
  ListKanikoResponse,
  UpdateDescription,
  UpdateTaskType,
} from '../imagepack'

// export const apiAdminImagepackCreate = async (imagepack: KanikoCreate) => {
//   const response = await instance.post<IResponse<string>>(
//     VERSION + "/admin/images/create",
//     imagepack,
//   );
//   return response.data;
// };

// export const apiAdminImagePackList = (type: number) =>
//   instance.get<IResponse<ImagePackListResponse>>(
//     `${VERSION}/admin/images/list?type=${type}`,
//   );

// export const apiAdminImagePackDelete = async (id: number) => {
//   const response = await instance.post<IResponse<string>>(
//     VERSION + "/admin/images/delete",
//     id,
//   );
//   return response.data;
// };

// export interface UpdateImagePublicStatusRequest {
//   id: number;
//   imagetype: number;
// }

export const apiAdminImagePublicStatusChange = async (id: number) => {
  const response = await instance.post<IResponse<string>>(VERSION + '/admin/images/change', id)
  return response.data
}

export const apiAdminListImage = () =>
  instance.get<IResponse<ListImageResponse>>(`${VERSION}/admin/images/image`)

export const apiAdminDeleteKanikoList = (idList: number[]) =>
  instance.post<IResponse<string>>(`${VERSION}/admin/images/deletekaniko`, {
    idList,
  })

export const apiAdminListKaniko = () =>
  instance.get<IResponse<ListKanikoResponse>>(`${VERSION}/admin/images/kaniko`)

export const apiAdminDeleteImageList = (idList: number[]) =>
  instance.post<IResponse<string>>(`${VERSION}/admin/images/deleteimage`, {
    idList,
  })

export const apiAdminChangeImagePublicStatus = (id: number) =>
  instance.post<IResponse<string>>(VERSION + `/admin/images/change/${id}`)

export const apiAdminChangeImageDescription = (data: UpdateDescription) =>
  instance.post<IResponse<string>>(`${VERSION}/admin/images/description`, data)

export const apiAdminChangeImageTaskType = (data: UpdateTaskType) =>
  instance.post<IResponse<string>>(`${VERSION}/admin/images/type`, data)
