const { Events } = require("discord.js");
const cron = require("node-cron");
const prisma = require("../utils/prisma");

function padTo2Digits(num) {
  return num.toString().padStart(2, "0");
}

function convertMsToTime(milliseconds) {
  let seconds = Math.floor(milliseconds / 1000);
  let minutes = Math.floor(seconds / 60);
  let hours = Math.floor(minutes / 60);

  seconds = seconds % 60;
  minutes = minutes % 60;

  // 👇️ If you don't want to roll hours over, e.g. 24 to 00
  // 👇️ comment (or remove) the line below
  // commenting next line gets you `24:00:00` instead of `00:00:00`
  // or `36:15:31` instead of `12:15:31`, etc.
  hours = hours % 24;

  return `${padTo2Digits(hours)}:${padTo2Digits(minutes)}:${padTo2Digits(
    seconds
  )}`;
}
let currentDate = new Date().toJSON().slice(0, 10);

const logged_data = new Map();

cron.schedule("* 22 * * *", async () => {
  const add_stats_to_db = await prisma.stats.create({
    data: {
      log: Array.from(logged_data.values()),
      date: new Date().toLocaleDateString(),
    },
  });
  logged_data.clear();
});

module.exports = {
  name: Events.VoiceStateUpdate,
  async execute(oldState, newState) {
    // const checkUser = await prisma.user.findFirst({
    //   where: { user_id: newState.member.user.tag },
    // });
    if (oldState.member.roles.cache.some((role) => role.name == "parnex")) {
      logged_data.get(newState.member.user.tag)
        ? null
        : logged_data.set(newState.member.user.tag, {
            user_id: newState.member.user.tag,
            log: {
              join: [],
              leave: [],
              move: [],
            },
            initial_time: 0,
            join_vc_time: 0,
            leave_vc_time: 0,
            total_time: 0,
            afk_start_time: 0,
            afk_end_time: 0,
            total_inactive: 0,
            move_vc_time: 0,
            worked_time: null,
          });
      // let {
      //   initial_time,
      //   join_vc_time,
      //   leave_vc_time,
      //   total_time,
      //   afk_start_time,
      //   afk_end_time,
      //   total_inactive,
      //   move_vc_time,
      // } = logged_data.get(newState.member.user.tag);
      if (oldState.channelId == null) {
        logged_data.get(newState.member.user.tag).initial_time = Date.now();

        let join_log_date_obj = new Date();

        logged_data.get(newState.member.user.tag).join_vc_time =
          join_log_date_obj.toLocaleTimeString();

        logged_data
          .get(newState.member.user.tag)
          .log.join.push(
            `${newState.member.user.tag} Joined ${newState.channel.name} at ${
              logged_data.get(newState.member.user.tag).join_vc_time
            }`
          );

        console.log(
          `${newState.member.user.tag} joined ${newState.channel.name}`
        );
      }
      if (newState.channelId == null) {
        if (oldState.channelId == "1102984014454861885") {
          logged_data.get(newState.member.user.tag).afk_end_time = Date.now();

          let updated_time =
            logged_data.get(newState.member.user.tag).afk_end_time -
            logged_data.get(newState.member.user.tag).afk_start_time;

          logged_data.get(newState.member.user.tag).total_inactive =
            logged_data.get(newState.member.user.tag).total_inactive +
            updated_time;
        }

        let final_time = Date.now();
        let leave_log_date_obj = new Date();

        let updated_time =
          final_time - logged_data.get(newState.member.user.tag).initial_time;
        // console.log("updated_time " + convertMsToTime(updated_time))
        // console.log("total time " + convertMsToTime(total_time))

        logged_data.get(newState.member.user.tag).total_time =
          logged_data.get(newState.member.user.tag).total_time +
          updated_time -
          logged_data.get(newState.member.user.tag).total_inactive;

        logged_data.get(newState.member.user.tag).leave_vc_time =
          leave_log_date_obj.toLocaleTimeString();
        // vc_log.leave.push(
        //   `Left ${oldState.channel.name} at ${leave_vc_time}`
        // );
        logged_data
          .get(newState.member.user.tag)
          .log.leave.push(
            `${newState.member.user.tag} Left ${oldState.channel.name} at ${
              logged_data.get(newState.member.user.tag).leave_vc_time
            }`
          );

        logged_data.get(newState.member.user.tag).worked_time = convertMsToTime(
          logged_data.get(newState.member.user.tag).total_time
        );

        console.log(
          `${newState.member.user.tag} left ${oldState.channel.name}`
        );

        console.log(
          `${newState.member.user.tag} worked for ${convertMsToTime(
            logged_data.get(newState.member.user.tag).total_time
          )}`
        );

        console.log(logged_data.get(newState.member.user.tag));
      }
      if (
        oldState.channelId != null &&
        newState.channelId != null &&
        oldState.channelId != newState.channelId
      ) {
        // let final_time = Date.now();
        let move_log_date_obj = new Date();
        // let updated_time = final_time - initial_time;
        logged_data.get(newState.member.user.tag).move_vc_time =
          move_log_date_obj.toLocaleTimeString();

        logged_data
          .get(newState.member.user.tag)
          .log.move.push(
            `${newState.member.user.tag} Moved to ${newState.channel.name} at ${
              logged_data.get(newState.member.user.tag).move_vc_time
            }`
          );
        // total_time = total_time + updated_time;
        // console.log("total time in moved " + convertMsToTime(total_time))
        console.log(
          `${newState.member.user.tag} moved to ${newState.channel.name}`
        );
        if (
          oldState.channelId != null &&
          newState.channelId == "1102984014454861885"
        ) {
          logged_data.get(newState.member.user.tag).afk_start_time = Date.now();
          // console.log('hello')
        }
        if (
          oldState.channelId == "1102984014454861885" &&
          newState.channelId != "1102984014454861885"
        ) {
          logged_data.get(newState.member.user.tag).afk_end_time = Date.now();
          // console.log('hi')
          let updated_time =
            logged_data.get(newState.member.user.tag).afk_end_time -
            logged_data.get(newState.member.user.tag).afk_start_time;
          // console.log("afk start " + convertMsToTime(afk_start_time) + "  " + "afk end " + convertMsToTime(afk_end_time))
          logged_data.get(newState.member.user.tag).total_inactive =
            logged_data.get(newState.member.user.tag).total_inactive +
            updated_time;
          // console.log("total inactive " + convertMsToTime(total_inactive))
          // console.log("updated time move " + convertMsToTime(updated_time))
        }
      }
    }
  },
};
