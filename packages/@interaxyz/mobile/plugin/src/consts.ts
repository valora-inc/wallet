// https://regex101.com/r/nHrTa9/1/
export const APPLICATION_DID_FINISH_LAUNCHING_LINE_MATCHER =
  /-\s*\(BOOL\)\s*application:\s*\(UIApplication\s*\*\s*\)\s*\w+\s+didFinishLaunchingWithOptions:/g

export const APPLICATION_DID_FINISH_LAUNCHING_LINE_MATCHER_MULTILINE = new RegExp(
  APPLICATION_DID_FINISH_LAUNCHING_LINE_MATCHER.source + '.+\\n*{'
)
