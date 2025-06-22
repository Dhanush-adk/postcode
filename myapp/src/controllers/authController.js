import * as authSvc from '../services/authService.js';
import * as sessSvc from '../services/sessionService.js';
import { GenericResponse } from '../models/GenericResponse.js';

export const initiate = async (req,res,next)=>{
  try{
    const {email,phone,name}=req.body;
    // if(!email&&!phone) return res.status(400).json({
    //   statusCode:400,statusMessage:'Bad Request',
    //   message:'Validation failed',
    //   errors:[{field:'phone',message:'Either phone or email is required'}]
    // });
    if(!email&&!phone) return GenericResponse.error([{field:'phone',message:'Either phone or email is required'}], 'Bad Request',400).send(res);
    const r=await authSvc.initiate({email,phone,name});
    res.status(r.status).json(r.body);
  }catch(e){next(e);}
};

export const verify = async (req,res,next)=>{
  try{
    const r=await authSvc.verify(req.body);
    res.status(r.status).json(r.body);
  }catch(e){next(e);}
};

export const refreshToken = async (req,res,next)=>{
  try{
    const newJwt=await sessSvc.refresh(
      req.header('Authorization')?.split(' ')[1],
      req.body.refreshToken
    );
    res.json({accessToken:newJwt});
  }catch(e){next(e);}
};

export const closeSession=async(req,res,next)=>{
  try{await sessSvc.invalidate(req.session_id);res.json({message:'logged out'});}
  catch(e){next(e);}
};
