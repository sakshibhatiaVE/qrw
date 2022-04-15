import mailchimp from "@mailchimp/mailchimp_marketing";
const mailchimpConfig = {
    apiKey: "4c7f505e1a12325e7853b1155ca9bb2b-us7",
    server: "us7"
}
mailchimp.setConfig(mailchimpConfig);
//417205 - mail template id
//f233f2cdee - compaign id
export const createContact = async (userEmail) => {
    try {
        const lists = await mailchimp.lists.getAllLists();
        if (lists) {
            if (lists.lists.length > 0) {

                const localLists = lists.lists;
                let listId = null;
                localLists.forEach(each => {
                    if (each.name == 'Smartdata') {
                        listId = each.id
                    }
                })

                if (listId) {
                    const addListMember = await mailchimp.lists.addListMember(listId, {
                        email_address: userEmail,
                        status: "subscribed",
                    });
                    return true;
                }
            }
        }
    } catch (error) {

        let err = JSON.parse(JSON.stringify(error))
        let err1 = JSON.parse(err.response.text)
        return {'status':400,'message':err1.detail}
    }

}
// export const setContent = async (username) => {
//     try {
//         // const response = await mailchimp.campaigns.setContent("f233f2cdee",{
//         //     template:{
//         //         id:417205,
//         //         sections:{
//         //             'username':username
//         //         }
//         //     }
//         // });
//         const response = await mailchimp.campaigns.list();
//         //const response = await mailchimp.templates.list();

    
//         console.log(response);
//     } catch (error) {
//         console.log('err',error)
//     }
    
//   };
  
// run();



