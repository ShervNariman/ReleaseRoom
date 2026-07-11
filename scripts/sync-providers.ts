import { syncProviders } from "@/lib/integrations/sync";
const slug=process.argv[2]??"team-billing-settings";const result=await syncProviders(slug);console.log(JSON.stringify(result,null,2));
