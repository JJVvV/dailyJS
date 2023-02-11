declare -r __GIT_DESCRIBE__ = $(git describe --tags --match "tag*")

echo __GIT_DESCRIBE__