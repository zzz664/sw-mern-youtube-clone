//인증처리
const {User} = require('../models/User');

let auth = (req, res, next) => {
    //client쿠키에서 토큰 가져오기
    let token = req.cookies.x_auth;
    //토큰 복호화 후 유저 찾기
    User.findByToken(token, (err, userInfo) => {
        if(err) throw err;
        if(!userInfo) return res.json({
            isAuth: false,
            err: true
        });

        req.token = token;
        req.userInfo = userInfo;

        next(); //middleware에서 다음으로 넘어가기 위해 실행해줌
    });
    //유저가 유효하면 인증완료
    //유저가 유요하지 않으면 인증불가

};

module.exports = {auth};