package org.apache.daffodil.debugger.dap

import cats.effect.IO
import cats.syntax.all._
import java.nio.file.Path
import org.apache.daffodil.sapi._

trait Compiler {
  def compile(schema: Path): IO[DataProcessor]
}

object Compiler {
  def apply(): Compiler =
    new Compiler {
      def compile(schema: Path): IO[DataProcessor] =
        IO.blocking(
          Daffodil
            .compiler()
            .compileFile(schema.toFile())
        ).ensureOr(pf => CompilationFailed(pf.getDiagnostics))(!_.isError)
          .map(_.onPath("/"))
    }

  case class CompilationFailed(seq: Seq[Diagnostic])
      extends Exception(seq.map(_.toString).mkString(", "))
}
