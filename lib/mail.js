import mailer from 'nodemailer';


let transporter = mailer.createTransport({
  service: 'Mailgun',
  auth: {
    user: 'postmaster@sandboxe5be29ef3e5645198cdc0387a2b22991.mailgun.org',
    pass: '00mr0j44wl56'
  }
});


export default function*(options) {


  return new Promise(resolve, reject) {


  }
}
