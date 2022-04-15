let schedule = require("node-schedule");
import Events from "../utilities/event";
import Room from "../collections/room";
import User from "../collections/user";
import CHATMASTER from "../collections/chat-master";
import Mongoose from "mongoose";
import config from 'config';
const axios = require('axios').default;
const { TVHELPLINEAPI, INSURANCEAPI, ORGCODE, APIKEY } = config.get("crm");
const { port } = config.get('app');
import { CHAT } from '../utilities/constants';

export default {

    startTimeCheck: async (payload) => {
        let count = 0;
        console.log('Cron job called');
        // console.log('Cron job payload: ', payload);
        const rule = new schedule.RecurrenceRule();
        rule.second = 0;
        const job = schedule.scheduleJob(rule, () => {
            count++;
            if (count == 5) {
                console.log('Cron Job Count: ', count);
                Events.emit('AGENT_REPLY_DELAY', payload);
                count = 0;
                job.cancel();
                console.log('Cron job ended!!');
            }
        });
    },

    startRequestCheck: async (payload) => {
        let count = 0;
        let roomData = {};
        let requestData = {};
        let requestId = '';
        let requestStatus = '';
        let previosAgentId = '';
        console.log('Request Check Cron job called')
        const rule = new schedule.RecurrenceRule();
        rule.second = 0;
        const job = schedule.scheduleJob(rule, async () => {

            count++;
            console.log('Request Cron Job Count: ', count);

            console.log('Request Cron job payload: ', payload)

            roomData = await Room.findOne({ _id: Mongoose.Types.ObjectId(payload.roomId), customerId: Mongoose.Types.ObjectId(payload.userId) }, { requests: 1 });
            console.log('Request Cron room: ', roomData)

            if (!requestId) {
                requestData = await roomData.requests.filter(o => o.status == 'Pending')[0]
                console.log('request data: ', requestData)
                if (requestData) {
                    requestId = requestData._id;
                    requestStatus = requestData.status;
                    previosAgentId = requestData.sendTo;
                } else {
                    count = 0;
                    job.cancel();
                    console.log('Request Cron job ended, because no pending request found!!');
                }
            } else {
                console.log('requestId: ', requestId)
                for (const r of roomData.requests) {
                    // console.log(r._id + ' == ' + requestId);
                    if ((r._id).toString() == requestId.toString()) {
                        requestData = r
                        requestStatus = r.status
                        console.log('request status: ', requestStatus)
                    }
                }
            }

            if (requestStatus == 'Accepted') {
                count = 0;
                job.cancel();
                console.log('Request Cron job ended, because request accepted!!');
            } else if (count == CHAT.REQUEST_AUTO_ASSIGN_TIME) {

                // fetch domain from chat master mapping
                const chatMasterData = await CHATMASTER.find({ domain: payload.domain }, { group: 1 });
                let chatGroups;
                if (port == 6105) {
                    chatGroups = chatMasterData.map(o => o.group);
                } else {
                    // to send insurance request to user of GROUP7 only
                    if (payload.domain == 'INSURANCE') {
                        chatGroups = ['GROUP7'];
                    }

                    // to send tv helpline request to user of FRONTLINE only
                    if (payload.domain == 'TVHELPLINE') {
                        chatGroups = ['FRONTLINE'];
                    }
                }

                // fetch best avaialble agent
                let availableAgents = await User.find(
                    { role: 4, is_deleted: false, isLogin: true, inhandTickets: { $lte: 200 }, group: { $in: chatGroups } },
                    { _id: 1, fname_en: 1, lname_en: 1, phone: 1, domain: 1, group: 1, inhandTickets: 1, pendingRequests: 1 }
                ).sort({ pendingRequests: 1 });
                console.log('available agents on request auto reject: ', availableAgents);

                if (availableAgents.length == 0) {
                    availableAgents = await User.find(
                        { role: 4, is_deleted: false, inhandTickets: { $lte: 200 }, group: { $in: chatGroups } },
                        { _id: 1, fname_en: 1, lname_en: 1, email: 1, phone: 1, domain: 1, group: 1, inhandTickets: 1, pendingRequests: 1 }
                    ).sort({ pendingRequests: 1 });
                    console.log('available agents on request auto reject: ', availableAgents);
                }

                // filter the agent who is rejecting the request
                availableAgents = availableAgents.filter(o => o._id.toString() != previosAgentId.toString())
                console.log('available agents on auto reject: ', availableAgents);

                for (const rm of roomData.requests) {
                    if ((rm._id).toString() == requestId.toString()) {
                        rm.sendTo = Mongoose.Types.ObjectId(availableAgents[0]._id)
                        rm.sendBy = Mongoose.Types.ObjectId(previosAgentId)
                        rm.createdAt = Date.now()
                    }
                }
                console.log('updated request on auto reject: ', roomData.requests);

                const updatedRoom = await Room.findByIdAndUpdate(roomData._id, { $set: { requests: roomData.requests } })
                console.log('updated room after auto reject: ', updatedRoom);
                
                //<-----------------update request count for agent who rejected request----------------->
                // get rejecting agent pending requests count
                const rejectedAgent = await User.findOne({_id: Mongoose.Types.ObjectId(previosAgentId)}, {pendingRequests: 1})

                // set pending request counts
                const pendingReqCountReject = (rejectedAgent.pendingRequests > 0)?(rejectedAgent.pendingRequests-1):0;
                console.log('Updated pending request count: ', pendingReqCountReject);

                // update pending request counts for agent
                await User.findByIdAndUpdate(rejectedAgent._id, {$set: {pendingRequests: pendingReqCountReject}});
                //<--------------------------------------------------------------------------------------->

                //<-----------------update request count for new assigned agent----------------->
                // set pending request counts
                const pendingReqCount = (availableAgents[0].pendingRequests >= 0)?(availableAgents[0].pendingRequests+1):1;
                console.log('Updated pending request count: ', pendingReqCount);

                // update pending request counts for agent
                await User.findByIdAndUpdate(availableAgents[0]._id, {$set: {pendingRequests: pendingReqCount}});
                //<--------------------------------------------------------------------------------------->

                const agentdata = await User.findOne(
                    { _id: Mongoose.Types.ObjectId(availableAgents[0]._id) },
                    { email: 1 }
                );

                console.log('domain for reject req API: ', payload.domain);
                //CRM notify when agent reject chat request
                const notifyAg = await axios({
                    method: 'post',
                    url: (payload.domain == 'INSURANCE' ? INSURANCEAPI : TVHELPLINEAPI) + '/appChatAcceptRejectIntimation',
                    data: {
                        "agentLoginId": agentdata.email,
                        "clientId": payload.clientId,
                        "acceptOrReject": 'Reject'
                    },
                    headers: {
                        "orgcode": ORGCODE,
                        "api-key": APIKEY,
                        "Content-Type": "application/json"
                    }
                }).then(data => {
                    console.log("Agent notify reject res---> ", data.data)
                    // response = data.data
                }).catch(e => {
                    console.log('Agent notify reject error: ', e)
                    // return {error: e}
                })

                count = 0;
                job.cancel();
                console.log('Reassign request');
                console.log('Request Cron job ended!!');

                Events.emit("REQUEST_CHAT_LIST_UPDATE", {
                    agentId: availableAgents[0]._id,
                    oldAgentId: previosAgentId
                });
            }

        });
    },
}

