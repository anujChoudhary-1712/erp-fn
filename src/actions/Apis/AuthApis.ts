import * as ApiCalls from "../ApiCalls";

const loginUser = async (data:{email:string, password:string,userType:string}) => {
    return ApiCalls.postResponse("/auth/login", data, null)
}

const AuthApis = {
    loginUser
}

export default AuthApis;