// four-armed bandit task
// increase condition
// present stimuli and get response -> chosen slot spins -> present outcome


const jsPsych = initJsPsych({
});

let start_FS = {// fullscreen
    type: jsPsychFullscreen,
    message: '<p>ウィンドウサイズを最大化します。下のボタンを押してください。</p>',
    button_label: 'Continue',
    fullscreen_mode: true 
};

// prepare variables
let prac_or_main;
let participantID;
let exp_num;
let i_or_d; // condition of the current experiment
let total_tn = 0; // total trial index
let tn = 0; // trial number (to count), reset at the beggining of each blocks
let prac_tn = 0;
let trial_n_block = 75; // the number of whole trials in each blocks
let trial_n_prac = 15; // the number of whole practice trials
let bn = 1; // block number (to count)
let block_n = 4; // the number of whole blocks
let vec = [0 ,1, 2, 3];
let choice_duration = 1500;
let spin_duration = 3000;
let outcome_duration = 1000;
let ul_stim; // upper left stimulus
let ur_stim; // upper right stimulus
let ll_stim; // lower left stimulus
let lr_stim; // lower right stimulus
let pressed_key;
let selected_stim;
let outcome;
let cv_l = 8/50; // images[0] or images[1]
let cv_s = 2/50; // images[2] or images[3]
let point_total = 0;
let point_block = 0;
let filename;

// ----------- Generate reward mean of each option -----------
// function to generate random numbers from gaussian distribution (using randn func of jStat library)
let rnorm = function (m, sd, o) {
    a = jStat.randn(1);
    b = a*sd + m;
    if (o == 1) { // avoid negative outcome
        if (b < 0) {
            b = 0;
        }
    };
    return b;
};

// function to generate random numbers from uniform distribution
let runif = function(min, max) {
    let a = Math.random();
    b = a * (max-min) + min;
    return b;
};

// function to generate fluctuating mean of each slot machine (Gaussian random walk)
let reward_mean = function(trial_n, step_size, incr_size, lambda, cv_nu,
                            participantID, exp_num) {// cv_nu=2.8/50
    let theta_0;
    let bl_num = Math.floor(trial_n / step_size);

    if (participantID % 2 == 0) {
        if (exp_num == 1) {
            i_or_d = "incr"; // increase condition
        } else {
            i_or_d = "decr"; // decrease condition
        }
    } else { // odd number
        if (exp_num == 1) {
            i_or_d = "decr"; // decrease condition 
        } else {
            i_or_d = "incr"; // increase condition
        }
    };
       
    
    if (i_or_d == "incr") {
        theta_0 = 100;
    } else { // decrease condition
        theta_0 = 100 + incr_size * (bl_num - 1);
    };
    let mus = Array(trial_n).fill(0);
    let min_v = theta_0 - incr_size*5;
    let max_v = theta_0 + incr_size*5;

    mus[0] = runif(min_v, max_v);

    for (let bl_idx = 1; bl_idx < (bl_num+1); bl_idx++) {
        if (i_or_d == "incr") {
            bl_mean = theta_0 + (bl_idx-1)*incr_size; // increase condition
        } else {
            bl_mean = theta_0 - (bl_idx-1)*incr_size; // decrease condition
        }

        for (let step_idx = 1; step_idx < (step_size + 1); step_idx++) {
            let total_idx = step_size*(bl_idx-1) + step_idx;
            if (total_idx < trial_n) {
                let nu = rnorm(m=0, sd=cv_nu*bl_mean, o=0);
                mus[total_idx] = lambda*mus[total_idx-1] + (1-lambda)*bl_mean + nu;
            }
        };
    };
    return mus;
};

// paratmeters for reward means for four options
let trial_n = trial_n_block * block_n; // 300
let step_size = 15;
let incr_size = 5;
let lambda = 0.9;
let cv_nu = 2.8/50;
let ms = Array(4).fill(0); // mean reward of each option

// ------------ For instruction ------------
const get_ID = {
    type: jsPsychSurveyText,
    questions: [
        {
            prompt: "あなたのIDを回答してください（実験実施者から通達された数字です）。",
            required: true,
            name: "participant_ID"
        }
    ],
    on_load: function() {
        let element = document.getElementById('input-0');
        element.type = 'number',
        element.min =0,
        element.max = 9999
    },
    on_finish: function(data) {
        participantID = data.response.participant_ID;
    }
};

const get_exp_num = {
    type: jsPsychSurveyText,
    questions: [
        {
            prompt: "今回は何回目の実験ですか？ <b>1か2の半角数字のみ</b>で回答してください。",
            required: true,
            name: "exp_num"
        }
    ],
    on_load: function() {
        let element = document.getElementById('input-0');
        element.type = 'number',
        element.min = 1,
        element.max = 2
    },
    on_finish: function(data) {
        exp_num = data.response.exp_num;
        // generate reward means for four options
        for (let k = 0; k < 4; k++) {
            ms[k] = reward_mean(trial_n, step_size, incr_size, lambda, cv_nu, participantID, exp_num);
        };
    }
};


// preload images
let images = [
    ['stims/stim1.png', 'stims/stim1_selected.gif'],
    ['stims/stim2.png', 'stims/stim2_selected.gif'],
    ['stims/stim3.png', 'stims/stim3_selected.gif'],
    ['stims/stim4.png', 'stims/stim4_selected.gif']
];

images = jsPsych.randomization.shuffle(images);
console.log(images);

const preload = {
    type: jsPsychPreload,
    images: images
};


const inst = { 
    type: jsPsychInstructions,
    pages: [
        "<img src='exp_explain/スライド1.PNG'>",
        "<img src='exp_explain/スライド2.PNG'>",
        "<img src='exp_explain/スライド3.PNG'>",
        "<img src='exp_explain/スライド4.PNG'>",
        "<img src='exp_explain/スライド5.PNG'>",
        "<img src='exp_explain/スライド6.PNG'>",
        "<img src='exp_explain/スライド7.PNG'>"
    ],
    key_forward: "j",
    key_backward: "f"
};


let slides = [
    'exp_explain/スライド1.PNG',
    'exp_explain/スライド2.PNG',
    'exp_explain/スライド3.PNG',
    'exp_explain/スライド4.PNG',
    'exp_explain/スライド5.PNG',
    'exp_explain/スライド6.PNG',
    'exp_explain/スライド7.PNG',
];

const preload2 = {
    type: jsPsychPreload,
    images: slides
};

// ------------- For Practice --------------
const text_after_prac = {
    type: jsPsychHtmlKeyboardResponse,
    stimulus: "<p class='inst_text'>これで練習は終了です。<br>本番は4つのブロックに分かれています。<br>" +
              "ブロックが終了したら，必要なだけ休憩を取って次のブロックへ進んでください。<br>" +
              "4つの選択肢の平均的な良さは，<b>練習の時とは無関係</b>ですので，注意してください。<br>" +
              "それでは，準備ができたら<b>スペースキー<b>を押して本番を開始してください。</p>",
    choices: [" "]
};

// ------------- For the Main experiment ------------
// Present stimuli and get response
const select_stimuli = {
    type: jsPsychHtmlKeyboardResponse,
    stimulus: function() {
        vec = jsPsych.randomization.shuffle(vec);
        console.log(vec);
        ul_stim = images[vec[0]][0]; // upper left stimulus
        ur_stim = images[vec[1]][0]; // upper right stimulus
        lr_stim = images[vec[2]][0]; // lower right stimulus
        ll_stim = images[vec[3]][0]; // lower left stimulus
        let html = `<p class='upper_left_position'><img src=${ul_stim} width=320px></p>`;
        html += `<p class='upper_right_position'><img src=${ur_stim} width=320px></p>`;
        html += `<p class='lower_right_position'><img src=${lr_stim} width=320px></p>`;
        html += `<p class='lower_left_position'><img src=${ll_stim} width=320px></p>`;
        html += "<p class='upper_left_point'>R</p>";
        html += "<p class='upper_right_point'>I</p>";
        html += "<p class='lower_right_point'>J</p>";
        html += "<p class='lower_left_point'>F</p>";
        html += "<p class='center'>+</p>";
        return(html);
    },
    choices: ["r", "i", "f", "j"],
    trial_duration: choice_duration,
    on_finish: function() {
        console.log(total_tn);
        pressed_key = jsPsych.data.get().last(1).values()[0].response; // r=ul, i=ur, f=ll, j=lr
        if (pressed_key == "r") {
            selected_stim = vec[0];
        } else if (pressed_key == "i") {
            selected_stim = vec[1];
        } else if (pressed_key == "j") {
            selected_stim = vec[2];
        } else if (pressed_key == "f") {
            selected_stim = vec[3];
        } else {// no response
            selected_stim = 4; // no response
        };
    }
};

// spin selected stimulus
const spin = {
    type: jsPsychHtmlKeyboardResponse,
    stimulus: function() {
        let html = "";
        if (pressed_key == "r") {// upper left stimulus was chosen
            ul_stim = images[vec[0]][1];
            html = "<p class='center'>+</p>";
        } 
        else if (pressed_key == "i") {// upper right stimulus was chosen
            ur_stim = images[vec[1]][1];
            html = "<p class='center'>+</p>";
        }
        else if (pressed_key == "j") {// lower right stimulus was chosen
            lr_stim = images[vec[2]][1];
            html = "<p class='center'>+</p>";
        }
        else if (pressed_key == "f") {// lower left stimulus was chosen
            ll_stim = images[vec[3]][1];
            html = "<p class='center'>+</p>";
        };
        html += `<p class='upper_left_position'><img src=${ul_stim} width=320px></p>`;
        html += `<p class='upper_right_position'><img src=${ur_stim} width=320px></p>`;
        html += `<p class='lower_right_position'><img src=${lr_stim} width=320px></p>`;
        html += `<p class='lower_left_position'><img src=${ll_stim} width=320px></p>`;

        if (pressed_key == null) { // no response
            html += '<p class="center">No point...</p>';
        };

        return(html);
    },
    choices: "NO_KEYS",
    trial_duration: spin_duration
};

// show outcome
const show_outcome = {
    type: jsPsychHtmlKeyboardResponse,
    stimulus: function() {
        ul_stim = images[vec[0]][0]; // upper left stimulus
        ur_stim = images[vec[1]][0]; // upper right stimulus
        lr_stim = images[vec[2]][0]; // lower right stimulus
        ll_stim = images[vec[3]][0]; // lower left stimulus
        let html = `<p class='upper_left_position'><img src=${ul_stim} width=320px></p>`;
        html += `<p class='upper_right_position'><img src=${ur_stim} width=320px></p>`;
        html += `<p class='lower_right_position'><img src=${lr_stim} width=320px></p>`;
        html += `<p class='lower_left_position'><img src=${ll_stim} width=320px></p>`;

        let true_m = [ms[0][total_tn], ms[1][total_tn], ms[2][total_tn], ms[3][total_tn]];
        let true_cv = [cv_l, cv_l, cv_s, cv_s];
        let true_sd = Array(4);
        for (let k=0; k<4; k++) {
            true_sd[k] = true_m[k]*true_cv[k];
        };
        console.log(true_m);
        console.log(true_cv);
        console.log(true_sd);

        if (pressed_key == "r") {// upper left stimulus was chosen
            outcome = Math.round(rnorm(true_m[vec[0]], true_sd[vec[0]], o=1));
            html += `<p class='upper_left_point'>+${outcome} points!</p>`;
            html += "<p class='center'>+</p>";
        }
        else if (pressed_key == "i") {// upper right stimulus was chosen
            outcome = Math.round(rnorm(true_m[vec[1]], true_sd[vec[1]], o=1));
            html += `<p class='upper_right_point'>+${outcome} points!</p>`;
            html += "<p class='center'>+</p>";
        }
        else if (pressed_key == "j") {// lower right stimulus was chosen
            outcome = Math.round(rnorm(true_m[vec[2]], true_sd[vec[2]], o=1));
            html += `<p class='lower_right_point'>+${outcome} points!</p>`;
            html += "<p class='center'>+</p>";
        }
        else if (pressed_key == "f") {// lower left stimulus was chosen
            outcome = Math.round(rnorm(true_m[vec[3]], true_sd[vec[3]], o=1));
            html += `<p class='lower_left_point'>+${outcome} points!</p>`;
            html += "<p class='center'>+</p>";
        }
        else {
            outcome = 0;
            html += '<p class="center">No point...</p>'
        };
        return html;
    },
    choices: "NO_KEYS",
    trial_duration: outcome_duration,
    on_finish: function(data) {
        console.log(i_or_d);
        point_total += outcome;
        point_block += outcome;
        data.participantID = participantID;
        data.exp_num = exp_num;
        data.incr_decr = i_or_d;
        data.main_or_prac = prac_or_main;
        data.block = bn;
        data.total_tn = total_tn+1;
        data.selected_stim = selected_stim;
        data.outcome = outcome;
        data.total_point = point_total;
        data.point_in_block = point_block;
        data.m1 = ms[0][total_tn];
        data.m2 = ms[1][total_tn];
        data.m3 = ms[2][total_tn];
        data.m4 = ms[3][total_tn];
        total_tn += 1;
    }
};

// ITI
const iti = {
    type: jsPsychHtmlKeyboardResponse,
    stimulus: function() {
        let html = "<p class='center'>+</p>";
        return html;
    },
    choices: "NO_KEYS",
    trial_duration: function() {
        let dur = runif(min=1000, max=2000);
        return dur;
    }
};

// timeline for one block
const one_block = {
    on_timeline_start: function() {
        prac_or_main = "main";
    },
    timeline: [
        iti,
        select_stimuli,
        spin,
        show_outcome
    ],
    loop_function: function() {
        if (tn > trial_n_block - 2) {// if tn > 73
            tn = 0; // reset
            point_block = 0;
            return false;
        } else {
            tn += 1;
            return true;
        };
    }
};

// timeline for rest
const rest = {
    type: jsPsychHtmlKeyboardResponse,
    stimulus: function() {
        let text = `<p class="inst_text">4ブロック中${Number(bn)}回目のブロックが終了しました。<br>まだブロックがある場合は必要なだけ休憩を取ってください。<br>そして準備ができたらスペースキーを押して次のブロックへ進んでください。` + 
                    "<br>4回目のブロックが終了した場合は，スペースキーを押してください。</p>";
        return(text);
    },
    choices: [" "]
};

// timeline for the end of the experiment
const end_exp = {
    type: jsPsychHtmlKeyboardResponse,
    stimulus: "<p class='inst_text'>これで実験は終了です。お疲れさまでした。<br>「実験後の質問紙」に回答するのを忘れないようにお願いいたします。<br><b>スペースキーを押して，"  +
        "必ず画面が真っ暗になったのを確認してから</b>，画面を閉じてください。<br>灰色のローディングマークが中央で回っている間は，データ転送中ですので，画面を消さないでください。</p>",
    choices: [" "]
};


// timeline for practice
const prac = {
    on_timeline_start: function() {
        prac_or_main = "prac";
    },
    timeline: [
        iti,
        select_stimuli,
        spin,
        show_outcome
    ],
    loop_function: function() {
        if (tn > trial_n_prac - 2) {
            // reset
            tn = 0;
            total_tn = 0;
            point_total = 0;
            point_block = 0;
            return false;
        } else {
            tn += 1;
            return true;
        };
    }
}

// timeline for four blocks
const four_blocks = {
    timeline: [
        one_block,
        rest
    ],
    loop_function: function() {
        if (bn > block_n-1) {
            return false;
        } else {
            bn += 1;
            return true;
        }
    }
};

// timeline to save data using pipeline
const save_data = {
    type: jsPsychPipe,
    action: "save",
    experiment_id: "lIwnUjypaHPU",
    filename: function() {
        filename = `${participantID}_${exp_num}.csv`;
        return(filename);
    },
    data_string: ()=>jsPsych.data.get().csv()
  };

// timeline for full experiment
const full_exp = {
    timeline: [
        preload,
        preload2,
        start_FS,
        get_ID,
        get_exp_num,
        inst,
        prac,
        text_after_prac,
        four_blocks,
        end_exp,
        save_data
    ]
};

const timeline = [full_exp];

// start the experiment
jsPsych.run(timeline);
