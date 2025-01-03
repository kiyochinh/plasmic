// This is a skeleton starter React component generated by Plasmic.
// This file is owned by you, feel free to edit as you see fit.
import { useCommentsCtx } from "@/wab/client/components/comments/CommentsProvider";
import { getSetOfVariantsForViewCtx } from "@/wab/client/components/comments/utils";
import { useAppCtx } from "@/wab/client/contexts/AppContexts";
import { useViewCtxMaybe } from "@/wab/client/contexts/StudioContexts";
import {
  DefaultCommentPostFormProps,
  PlasmicCommentPostForm,
} from "@/wab/client/plasmic/plasmic_kit_comments/PlasmicCommentPostForm";
import { CommentData, CommentThreadId } from "@/wab/shared/ApiSchema";
import { ensure, jsonClone, mkUuid, withoutNils } from "@/wab/shared/common";
import { observer } from "mobx-react";
import * as React from "react";
import { useState } from "react";

export type CommentPostFormProps = DefaultCommentPostFormProps & {
  threadId?: CommentThreadId;
};

const CommentPostForm = observer(function CommentPostForm(
  props: CommentPostFormProps
) {
  const { threadId, ...rest } = props;

  const viewCtx = useViewCtxMaybe();
  const focusedTpls = withoutNils(viewCtx?.focusedTpls() ?? []);

  const { projectId, branchId, allComments, bundler, refreshComments } =
    useCommentsCtx();

  const api = useAppCtx().api;

  const [body, setBody] = useState("");

  if (!viewCtx || focusedTpls.length !== 1) {
    return null;
  }

  const focusedTpl = focusedTpls[0];

  function isValidComment() {
    return body.trim().length > 0;
  }

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        const location = threadId
          ? jsonClone(
              ensure(
                allComments.find((c) => c.threadId === threadId),
                `Some comment should exist for threadId ${threadId}`
              ).location
            )
          : {
              subject: bundler.addrOf(ensure(focusedTpl, "")),
              variants: getSetOfVariantsForViewCtx(viewCtx, bundler).map((pv) =>
                bundler.addrOf(pv)
              ),
            };
        const commentData: CommentData = {
          body,
          threadId: threadId ?? (mkUuid() as CommentThreadId),
          location,
        };
        setBody("");
        await api.postComment(projectId, branchId, commentData);
        await refreshComments();
      }}
    >
      <PlasmicCommentPostForm
        {...rest}
        bodyInput={{
          name: "comment",
          placeholder: `${
            threadId ? "Reply to this thread" : "Post a comment"
          }`,
          value: body,
          onChange: (e) => setBody(e.target.value),
        }}
        submitButton={{
          htmlType: "submit",
          disabled: !isValidComment(),
        }}
      />
    </form>
  );
});

export default CommentPostForm;
