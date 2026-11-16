import { ZodError } from "zod";
export function errorResponse(err:unknown) {
  if (err instanceof ZodError) return {status:400,body:{error:{code:"VALIDATION_ERROR",message:"Confira os campos informados.",details:err.flatten().fieldErrors}}};
  const message = err instanceof Error ? err.message : "Erro inesperado.";
  return {status:500,body:{error:{code:"INTERNAL_ERROR",message:process.env.NODE_ENV==="production"?"Não foi possível concluir a operação.":message}}};
}
