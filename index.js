function formatValues(filter) {
    const formatFilter = [];

    filter.forEach(rule => {
        if (/^(before|after)$/.test(rule.key)) {
            let date = formatFilter.find(rule => rule.key == "date");
            
            if (!date) {
                date = {value: {}, key: "date"};
                formatFilter.push(date);
            }
            
            date.value[rule.key] = rule.value;
            return;
        }
        
        if (/^(smaller|greater)$/.test(rule.key)) {
            let {key, value} = rule;
            let size = {key: "size", value, predicate: key};
            formatFilter.push(size);
            return;
        }
        
        if (rule.key == "match") {
            let match = formatFilter.find(rule => rule.key == "match");
            let {value} = rule;
            
            if (!match) {
                match = {key: "match"};
                formatFilter.push(match);
            }
            
            if (value.charAt(0) != "-") 
                match.accept = `${match.accept || ""} ${value}`.trim();
            else match.reject = `${match.reject || ""} ${value.slice(1)}`.trim(); 

            return;
        }
        
        if (rule.key == "has") {
            let has = formatFilter.find(rule => rule.key == "has");
            let {key, value} = rule;
            
            if (!has) {
                has = has || {key};
                formatFilter.push(has);
            }
            
            has[value] = true;
            
            return;
        }
        
        
        formatFilter.push(rule);
    });
    
    return formatFilter;
}

function createRule(rule, cur) {
    rule = rule || {};
    rule.value = cur;
    rule.key = rule.key || "match";
    return rule;
}

function parse(string) {
    if (typeof string !== "string")
        return [];
        
    const chars = string.split("");
    
    const filter = [];
    let cur = "";
    let group = false;
    let rule;

    chars.forEach(char => {
        switch(char) {
            case ":":
                rule = {key: cur};
                cur = "";
                break;
            case " ":
                if (!group) {
                    filter.push(createRule(rule, cur));
                    rule = null;
                    cur = "";
                    break;
                }
                cur += char;
            case "(":
                group = true;
                break;
            case ")":
                group = false;
                break;
            case "{":
                group = true;
                break;
            case "}":
                group = false;
                break;
            default:
                cur += char;
        }
    });
    
    if (rule || cur)
        filter.push(createRule(rule, cur));

    return formatValues(filter);
}

module.exports.parse = parse;

function formatFilterRule(values) {
    let words = values.split(/\s/g);
    let str = words.join(" ");

    if (words.length == 1) return str;
    return `(${str})`;
}

function formatMatchRule(rule) {
    const values = [];
    
    if (rule.accept) values.push(rule.accept);
    if (rule.reject) values.push(`-{${rule.reject}}`);
    return values.join(" ");
}

function format(filter) {
    if (!Array.isArray(filter))
        return "";
    
    const values = filter.map((rule) => {
        if ( /^(from|to|subject)$/.test(rule.key) )
            return `${rule.key}:${formatFilterRule(rule.value)}`;

        if (rule.key == "match")
            return `${formatMatchRule(rule)}`;

        if (rule.key == "date") 
            return `after:${rule.after} before:${rule.before}`;

        if (rule.key == "size")
            return `${rule.predicate}:${rule.size}`;
            
        if (rule.key == "has"&& rule.attachment)
            return "attachment:true";
            
        throw new Error(`Unexpected rule: ${rule.key}, ${rule.value}`);
    });
    
    return values.sort().join(" ");
}

module.exports.format = format;