import CareApp from './care-app';
import {sampleData} from '@/lib/model';
import {getChatGPTUser} from './chatgpt-auth';
export const dynamic='force-dynamic';
export default async function Page(){const user=await getChatGPTUser();return <CareApp initialData={sampleData()} user={user?{name:user.displayName,email:user.email}:null}/>}
