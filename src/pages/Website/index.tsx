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

import { configUrlWebsiteBaseAtom } from '@/utils/store/config'
import { useAtomValue } from 'jotai'
import { type FC } from 'react'

const Website: FC = () => {
  const website = useAtomValue(configUrlWebsiteBaseAtom)
  window.location.href = website
  return <></>
}

export default Website
